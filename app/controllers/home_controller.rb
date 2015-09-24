class HomeController < ApplicationController

  def index
    @page_name = t("home.label")
    @user = User.find_by_user_name(current_user_name)
    @notifications = PasswordRecoveryRequest.to_display
    load_user_module_data

    load_cases_information if display_cases_dashboard?
    load_incidents_information if display_incidents_dashboard?
    load_manager_information if display_manager_dashboard?
    load_gbv_incidents_information if display_gbv_incidents_dashboard?
  end

  private

  def search_flags(options={})
      map_flags(Flag.search{
        with(options[:field]).between(options[:criteria])
        with(:flag_record_type, options[:type])
        with(:flag_record_owner, current_user.user_name) unless options[:is_manager].present?
        with(:flag_flagged_by_module, options[:modules]) if options[:is_manager].present?
        with(:flag_is_removed, false)
        order_by(:flag_date, :asc)
      }.hits)
  end

  def map_flags(flags)
    flags.map{ |flag|
      {
        record_id: flag.stored(:flag_record_id),
        message: flag.stored(:flag_message),
        flagged_by: flag.stored(:flag_flagged_by),
        record_owner: flag.stored(:flag_owner),
        date: flag.stored(:flag_date),
        created_at: flag.stored(:flag_created_at),
        system_generated_follow_up: flag.stored(:flag_system_generated_follow_up),
        short_id: flag.stored(:flag_record_short_id),
        record_type: flag.stored(:flag_record_type),
        name: flag.stored(:flag_child_name),
        hidden_name: flag.stored(:flag_hidden_name),
        date_of_first_report: flag.stored(:flag_date_of_first_report),
      }
    }
  end

  def build_manager_stats(cases, flags)
    @aggregated_case_worker_stats = {}

    cases.facet(:owned_by).rows.each{|c| @aggregated_case_worker_stats[c.value] = {total_cases: c.count}}
    flags.select{|d| (Date.today..1.week.from_now.utc).cover?(d[:date])}
         .group_by{|g| g[:flagged_by]}
         .each do |g, fz|
            if @aggregated_case_worker_stats[g].present?
              @aggregated_case_worker_stats[g][:cases_this_week] = fz.count
            # else
            #   @aggregated_case_worker_stats[g] = {cases_this_week: f.count}
            end
          end

    flags.select{|d| (1.week.ago.utc..Date.today).cover?(d[:date])}
         .group_by{|g| g[:flagged_by]}
         .each do |g, fz|
            if @aggregated_case_worker_stats[g].present?
              @aggregated_case_worker_stats[g][:cases_overdue] = fz.count
            # else
            #   @aggregated_case_worker_stats[g] = {cases_overdue: f.count}}
            end
          end
    @aggregated_case_worker_stats
  end

  def display_cases_dashboard?
    @display_cases_dashboard ||= @record_types.include?("case")
  end

  def display_manager_dashboard?
    @display_manager_dashboard ||= current_user.is_manager?
  end

  def display_incidents_dashboard?
    @display_incidents_dashboard ||= @record_types.include?("incident") && @module_ids.include?(PrimeroModule::MRM)
  end

  def display_gbv_incidents_dashboard?
    @display_gbv_incidents_dashboard ||= @record_types.include?("incident") && @module_ids.include?(PrimeroModule::GBV)
  end

  def load_manager_information
    # TODO: Will Open be translated?
    module_ids = @module_ids

    cases = Child.search do
      with(:child_status, 'Open')
      if module_ids.present?
        any_of do
          module_ids.each do |m|
            with(:module_id, m)
          end
        end
      end
      facet :owned_by, limit: -1
      adjust_solr_params do |params|
        params['f.owned_by_s.facet.mincount'] = 0
      end
      paginate page: 1, per_page: 0
    end

    flags = search_flags({
      field: :flag_date,
      criteria: 1.week.ago.utc...1.week.from_now.utc,
      type: 'child',
      is_manager: true,
      modules: @module_ids
    })

    build_manager_stats(cases, flags)
  end

  def load_user_module_data
    @modules = @current_user.modules
    @module_ids = @modules.map{|m| m.id}
    @record_types = @modules.map{|m| m.associated_record_types}.flatten.uniq
  end

  def load_recent_activities
    Child.list_records({}, {:last_updated_at => :desc}, { page: 1, per_page: 20 }, current_user.managed_user_names)
  end

  def load_cases_information
    @stats = Child.search do
      with(:child_status, 'Open')
      with(:associated_user_names, current_user.user_name)

      facet(:risk_level) do
        row(:high) do
          with(:risk_level, 'High')
        end
        row(:medium) do
          with(:risk_level, 'Medium')
        end
        row(:low) do
          with(:risk_level, 'Low')
        end
      end

      facet(:records) do
        row(:new) do
          with(:is_new, true)
        end
        row(:total) do
        end
      end
    end
    binding.pry
    puts 'hello'
  end

  def load_incidents_information
    #Retrieve only MRM incidents.
    modules = [PrimeroModule::MRM]
    @incidents_recently_flagged = search_flags({field: :flag_created_at, criteria: 1.week.ago.utc..Date.tomorrow,
                                                type: 'incident'})
    @incidents_recently_flagged = @incidents_recently_flagged[0..4]
    @open_incidents = Incident.open_incidents(@current_user)
  end

  def load_gbv_incidents_information
    @gbv_incidents_recently_flagged = search_flags({field: :flag_created_at, criteria: 1.week.ago.utc..Date.tomorrow,
                                                type: 'incident'})
    @gbv_incidents_recently_flagged = @gbv_incidents_recently_flagged[0..4]
    @open_gbv_incidents = Incident.open_gbv_incidents(@current_user)
  end
end
