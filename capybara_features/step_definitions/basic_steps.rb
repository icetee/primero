Then /^I should see "([^\"]*)" on the page$/ do |text|
  expect(page).to have_content(text)
end

Then /^I should not see "([^\"]*)" on the page$/ do |text|
  expect(page).to have_no_content(text)
end

Then /^I should see (a|an) "([^\"]*)" button on the page$/ do |grammar, label|
  expect(page).to have_selector(:link_or_button, label)
end

Then /^I should see a "([^\"]*)" link on the page$/ do |label|
  expect(page).to have_selector(:link_or_button, label)
end

Then /^I press the "([^\"]*)" (button|link)$/ do |label, type|
  click_on(label)
end

Then /^I click on the "([^\"]*)" link/ do |label|
  click_on(label)
end

Then /^I should see the "([^\"]*)" field$/ do |field_name|
  find_field(field_name)
end

Then /^I fill in the "([^\"]*)" field with "([^\"]*)"$/ do |field_name, field_value|
  fill_in(field_name, :with => field_value)
end

Then /^I should see the following (.+):$/ do |selector, table|
  table.raw.flatten.each do |value|
    expect(page).to have_content(value)
  end
end

And /^I should see a value for "(.+)" on the show page(?: with the value of "(.*)")?$/ do |field, content|
  if content == "today's date"
    content = DateTime.now.strftime("%d/%b/%Y")
  end

  #Find the element that represent the field name
  within(:xpath, "//fieldset//label[@class='key']", :text => /\A#{Regexp.escape(field)}\z/) do
    #Sometime we just check if the field appears in the page.
    if content
      #Lookup the parent of the field to search the value
      within(:xpath, '../..') do
        #Find the element that represent the value.
        find(:xpath, ".//span[@class='value']", :text => content)
      end
    end
  end
end

And /^I fill in the (\d+)(?:st|nd|rd|th) "(.*)" subform with the follow:$/ do |num, subform, fields|
  step %Q{I add a "#{subform}" subform}
  num = num.to_i - 1
  subform = subform.downcase.gsub(" ", "_")
  within(:xpath, "//div[@id='subform_container#{subform}_#{num}']") do
    fields.rows_hash.each do |name, value|
      if value.start_with?("<Select>")
        step %Q{I select "#{value.gsub("<Select> ", "")}" from "#{name}"}
      else
        step %Q{I fill in "#{name}" with "#{value}"}
      end
    end
  end
end

And /^I remove the (\d+)(?:st|nd|rd|th) "(.*)" subform$/ do |num, subform|
  num = num.to_i - 1
  subform = subform.downcase.gsub(" ", "_")
  within(:xpath, "//div[@id='subform_container_#{subform}_#{num}']") do
    step %Q{I press the "Remove" button}
  end
end

## Added for debugging purposes
And /^pause$/ do
  binding.pry
end

And /^I should stay on the "(.+)" tab on the case "(.+)" page$/ do |tab, page_action|
  page.should have_css('h1', :text => tab, :visible => true)
  path = Rails.application.routes.recognize_path(current_url)
  page_action.should eql(path[:action])
end

And /^I check the "(.*)" field$/ do |checkbox|
  page.check(checkbox)
end

And /^I add a "(.*)" subform$/ do |form|
  form = form.downcase.gsub(" ", "_")
  find("//a[@id='subform_#{form}_add_button']",:visible => true).click
end

#////////////////////////////////////////////////////////////////
#//  Pre-Existing Steps
#////////////////////////////////////////////////////////////////

When /^I fill in the basic details of a child$/ do
  fill_in("Age", :with => "30")
end

When /^I attach a photo "([^"]*)"$/ do |photo_path|
    step %Q{I attach the file "#{photo_path}" to "child_photo0"}
end

When /^I attach an audio file "([^"]*)"$/ do |audio_path|
    step %Q{I attach the file "#{audio_path}" to "child[audio]"}
end

When /^I attach the following photos:$/ do |table|
  table.raw.each_with_index do |photo, i|
    step %Q{I attach the file "#{photo.first}" to "child[photo]#{i}"}
    step %Q{I click on the "Add another photo" link}
  end
end

Given /^the following form sections exist in the system:$/ do |form_sections_table|
  FormSection.all.each {|u| u.destroy }

  form_sections_table.hashes.each do |form_section_hash|
    form_section_hash.reverse_merge!(
      'unique_id'=> form_section_hash["name"].gsub(/\s/, "_").downcase,
      'fields'=> Array.new
    )

    form_section_hash["order"] = form_section_hash["order"].to_i
    form_section = FormSection.new(form_section_hash)
    form_section.save!
  end
end

Given /^the "([^\"]*)" form section has the field "([^\"]*)" with field type "([^\"]*)"$/ do |form_section, field_name, field_type|
  form_section = FormSection.get_by_unique_id(form_section.downcase.gsub(/\s/, "_"))
  field = Field.new(:name => field_name.dehumanize, :display_name => field_name, :type => field_type)
  FormSection.add_field_to_formsection(form_section, field)
end

Given /^the following fields exists on "([^"]*)":$/ do |form_section_name, table|
  form_section = FormSection.get_by_unique_id(form_section_name)
  form_section.should_not be_nil
  form_section.fields = []
  table.hashes.each do |field_hash|
    field_hash.reverse_merge!(
      'visible' => true,
      'type'=> Field::TEXT_FIELD
    )
    form_section.fields.push Field.new(field_hash)
  end
  form_section.save!
end

Then /^there should be (\d+) child records in the database$/ do |number_of_records|
  Child.all.length.should == number_of_records.to_i
end

When /^the date\/time is "([^\"]*)"$/ do |datetime|
  current_time = Time.parse(datetime)
  current_time.stub!(:getutc).and_return Time.parse(datetime)
  Clock.stub!(:now).and_return current_time
end

When /^the local date\/time is "([^\"]*)" and UTC time is "([^\"]*)"$/ do |datetime, utcdatetime|
  current_time = Time.parse(datetime)
  current_time_in_utc = Time.parse(utcdatetime)
  Clock.stub!(:now).and_return current_time
  current_time.stub!(:getutc).and_return current_time_in_utc
end

Given /^a child record named "([^"]*)" exists with a audio file with the name "([^"]*)"$/ do |name, filename|
  user = User.create!("user_name" => "bob_creator",
               "password" => "rapidftr",
               "password_confirmation" => "rapidftr",
               "full_name" => "Bob Creator",
               "organisation" => "UNICEF",
               "email" => "rapidftr@rapidftr.com",
               "disabled" => "false",
               "role_ids" => ["ADMIN"])
  child = Child.new_with_user_name(user,{:name=>name})
  child.audio = uploadable_audio("capybara_features/resources/#{filename}")
  child.create!
end

Given /^I am editing an existing child record$/ do
  child = Child.new
  child[:created_by] = "mary"
  child["birthplace"] = "haiti"
  child.photo = uploadable_photo
  child["unique_identifier"] = "UNIQUE_IDENTIFIER"
  raise "Failed to save a valid child record" unless child.save

  visit children_path+"/#{child.id}/edit"
end

Given /^an existing child with name "([^\"]*)" and a photo from "([^\"]*)"$/ do |name, photo_file_path|
  child = Child.new( :name => name, :birthplace => 'unknown', :created_by => "mary")
  child.photo = uploadable_photo(photo_file_path)
  child.create
end

When /^I am editing the child with name "([^\"]*)"$/ do |name|
  child = find_child_by_name name
  visit children_path+"/#{child.id}/edit"
end

When /^I wait for (\d+) seconds$/ do |seconds|
  sleep seconds.to_i
end

When 'I wait for the page to load' do
  if Capybara.current_driver == :selenium
    Timeout.timeout(Capybara.default_wait_time) do
      sleep(0.1) until value = page.evaluate_script('window["jQuery"] != undefined && window["jQuery"] != null && jQuery.active == 0')
      value
    end
  else
    page.has_content? ''
  end
end

When /^I wait until "([^"]*)" is visible$/ do |selector|
  page.has_content?(selector, :visible => true)
end

Then /^I should see (\d*) divs of class "(.*)"$/ do |quantity, div_class_name|
  divs = page.all :xpath, "//div[@class=\"#{div_class_name}\"]"
  divs.size.should == quantity.to_i
end

Then /^I should see (\d*) divs with text "(.*)" for class "(.*)"$/ do |quantity, div_text, div_class_name|
  divs = page.all :xpath, "//div[@class=\"#{div_class_name}\"]"
  divs.size.should == quantity.to_i
  divs.each do |div|
    div.text.should == div_text
  end
end

Then /^the "([^\"]*)" button presents a confirmation message$/ do |button_name|
  page.find("//a[@class='link_#{button_name.downcase}']")['data-confirm'].should_not be_nil
end

Given /^I flag "([^\"]*)" as suspect$/ do  |name|
  click_flag_as_suspect_record_link_for(name)
  fill_in("Flag Reason", :with => "Test")
  click_on("Flag")
end

When /^I flag "([^\"]*)" as suspect with the following reason:$/ do |name, reason|
  page.find(:xpath, "//div[text()=\"#{name}\"]/parent::*/parent::*/parent::*").click_on('Flag Record')
  fill_in("Flag Reason:", :with => reason)
  click_on("Flag")
end

When /^I flag as suspect with the following reason:$/ do |reason|
  click_on('Flag Record')
  fill_in("Flag Reason:", :with => reason)
  click_on("Flag")
end

When /^I unflag "([^\"]*)" with the following reason:$/ do |name, reason|
  click_unflag_as_suspect_record_link_for(name)
  fill_in("Unflag Reason", :with => reason)
  click_on("Unflag")
end

Then /^the (view|edit) record page should show the record is flagged$/ do |page_type|
  path = children_path+"/#{Child.all[0].id}"
  (page_type == "edit") ? visit(path + "/edit") : visit(path)
  page.should have_content("Flagged as suspect record by")
end

Then /^the child listing page filtered by flagged should show the following children:$/ do |table|
  expected_child_names = table.raw.flatten
  visit child_filter_path(:filter => "flag")
  expected_child_names.each do |name|
    #page.should have_xpath "//h2//a[contains(., '#{name}')]"
  page.should have_content("#{name}")
  end
end

When /^the record history should log "([^\"]*)"$/ do |field|
  visit(cases_path+"/#{Child.all[0].id}/history")
  page.should have_content(field)
end

Then /^I should (not )?see the "([^\"]*)" tab$/ do |do_not_want, tab_name|
  should = do_not_want ? :should_not : :should
  page.all(:css, ".tab-handles a").map(&:text).send(should, include(tab_name))
end

When /^I sleep (\d*) seconds$/ do |sleep_time|
  sleep sleep_time.to_i
end

Given /"([^\"]*)" is logged in/ do |user_name|
  step "\"#{user_name}\" is the user"
  step "I am on the login page"
  step "I fill in \"User Name\" with \"#{user_name}\""
  step "I fill in \"123\" for \"password\""
  step "I press \"Log in\""
end

Given /"([^\"]*)" is the user/ do |user_name|
  step "a user \"#{user_name}\" with a password \"123\" and \"Access all data\" permission"
end

Then /^I should not see any errors$/ do
  page.should_not have_xpath '//div[class="errorExplanation"]'
end

Then /^I should see the error "([^\"]*)"$/ do |error_message|
  page.should have_xpath "//div[@class=errorExplanation and contains(., '#{error_message}')]"
end

Then /^the "([^\"]*)" result should have a "([^\"]*)" image$/ do |name, flag|
  child_name = find_child_by_name name
  page.should have_css "#child_#{child_name.id} .#{flag}"
end

Given /I am logged out/ do
  step "I am on the logout page"
end

Then /^the "([^"]*)" dropdown should have "([^"]*)" selected$/ do |dropdown_label, selected_text|
  field_labeled(dropdown_label).value.should == selected_text
end

And /^I should see "([^\"]*)" in the list of fields$/ do |field_name|
  page.should have_xpath("//table[@id='form_sections']//tr[@class='rowEnabled' and contains(., '#{field_name}')]")
end

And /^I should see "([^\"]*)" in the list of fields and disabled$/ do |field_name|
  page.should have_xpath("//table[@id='form_sections']//tr[@class='rowDisabled' and contains(., '#{field_name}')]")
end

Given /^the "([^\"]*)" form section has the field "([^\"]*)" with help text "([^\"]*)"$/ do |form_section, field_name, field_help_text|
  form_section = FormSection.get_by_unique_id(form_section.downcase.gsub(/\s/, "_"))
  field = Field.new(:name => field_name.dehumanize, :display_name => field_name, :help_text => field_help_text)
  FormSection.add_field_to_formsection(form_section, field)
end

Then /^I should see the text "([^\"]*)" in the list of fields for "([^\"]*)"$/ do |expected_text, field_name |
  # This selector is no longer working, need to find some other selector for searching field
  field = page.find "//div[@id='#{field_name}Row']"
  field.should_not be_nil

  enabled_icon = field.enabled_icon
  enabled_icon.inner_html.strip.should == expected_text
end

Given /^the "([^\"]*)" form section has the field "([^\"]*)" hidden$/ do |form_section, field_name |
  form_section = FormSection.get_by_unique_id(form_section.downcase.gsub(/\s/, "_"))
  field = Field.new(:name => field_name.dehumanize, :display_name => field_name, :visible => false)
  FormSection.add_field_to_formsection(form_section, field)
end

Then /^I should see errors$/ do
  page.should have_xpath '//div[@class="errorExplanation"]'
end

private

def click_flag_as_suspect_record_link_for(name)
  child = find_child_by_name name
  visit children_path+"/#{child.id}"
  #find(:css, ".btn_flag").click
  click_on('Flag Record')
end

def click_unflag_as_suspect_record_link_for(name)
  child = find_child_by_name name
  visit children_path+"/#{child.id}"
  #find(:css, ".btn_flag").click
  click_on('Unflag Record')
end