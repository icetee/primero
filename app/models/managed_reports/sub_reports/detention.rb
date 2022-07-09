# frozen_string_literal: true

# Describes Detention subreport in Primero.
class ManagedReports::SubReports::Detention < ManagedReports::SubReport
  def id
    'detention'
  end

  def indicators
    [
      ManagedReports::Indicators::ViolationTallyDetention,
      ManagedReports::Indicators::PerpetratorsDetention,
      ManagedReports::Indicators::ReportingLocationDetention,
      ManagedReports::Indicators::DetentionStatus
    ]
  end

  def lookups
    {
      ManagedReports::Indicators::PerpetratorsDetention.id => 'lookup-armed-force-group-or-other-party',
      ManagedReports::Indicators::ReportingLocationDetention.id => 'Location',
      ManagedReports::Indicators::ViolationTallyDetention.id => 'lookup-violation-tally-options'
    }
  end

  def indicators_subcolumns
    sub_column_items = sub_column_items('lookup-gender-unknown-total')

    {
      ManagedReports::Indicators::PerpetratorsDetention.id => sub_column_items,
      ManagedReports::Indicators::ReportingLocationDetention.id => sub_column_items,
      ManagedReports::Indicators::DetentionStatus.id => sub_column_items
    }
  end
end
