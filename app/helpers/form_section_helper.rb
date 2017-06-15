module FormSectionHelper
  def sorted_highlighted_fields
    FormSection.sorted_highlighted_fields
  end

  def url_for_form_section_field(form_section_id, field)
    (field.new? || field.name.blank?) ? form_section_fields_path(form_section_id) : form_section_field_path(form_section_id, field.name)
  end

  def url_for_form_section(form_section)
    form_section.new? ? form_sections_path : form_section_path(form_section.unique_id)
  end

  def build_form_tabs(group, forms, show_summary = false)
    form = forms.first
    if forms.count > 1
      content_tag :li, class: 'group' do
        concat(
          link_to("#tab_#{form.section_name}", class: 'group',
            data: { violation: form.form_group_name == 'Violations' ? true : false }) do
            concat(group)
          end
        )
        concat(build_group_tabs(forms))
      end
    else
      content_tag :li, class: "#{init_tab(form, show_summary)}" do
        concat(
          link_to("#tab_#{form.section_name}", class: 'non-group') do
            concat(form.name)
          end
        )
      end
    end
  end

  def build_group_tabs(forms)
    group_id = "group_" + forms[0].form_group_name.gsub(" ", "").gsub("/", "")
    content_tag :ul , class: 'sub', id: group_id do
      for form in forms
        section_name = form.name
        if form.unique_id == "incident_details_container" && @child.alerts.any? {|u| u['type'] == "incident_details"}
          section_name = raw("<span id='new_incident_details'>! </span>") + section_name
        end
        concat(content_tag(:li,
          link_to("#tab_#{form.section_name}") do
            concat(section_name)
          end, class: "#{form.is_first_tab ? 'current': ''}"
        ))
      end
    end
  end

  def init_tab(form, show_summary)
    if show_summary && form.section_name == 'mrm_summary_page' || form.is_first_tab
      "current"
    else
      ""
    end
  end

  def subform_placeholder(field, subform)
    form_string = field.base_doc.is_violation? ? t("incident.violation.violation") : subform.display_name
    t('placeholders.subforms', form: form_string)
  end

  def display_help_text_on_view?(formObject, form_section)
    return false unless form_section.display_help_text_view

    # This is a verification whether *_documents section is empty
    # bia_documents are stored in a property bia_documents,
    # same thing with bid_documents and other_documents
    if form_section.unique_id.include? "documents"
      return formObject[form_section.unique_id].blank?
    end

    field = form_section.fields.first
    if field
      if field.type == Field::SUBFORM
        #If subform is the only field in the form and the first, check is is empty.
        if form_section.form_group_name.present? and form_section.form_group_name == "Violations"
          return formObject[form_section.form_group_name.downcase][field.name].blank?
        else
          return formObject[field.name].blank?
        end
      else
        #There is no straightforward way to know that "Audio and Photo" or "Other Documents" section are empties
        #So, the verification relies on the hardcoded attributes "recorded_audio" and "current_photo_key".

        if field.type == Field::PHOTO_UPLOAD_BOX
          #assumed we are on "Audio and Photo" because the first field is PHOTO_UPLOAD_BOX
          blank = formObject["current_photo_key"].blank?
          #assumed the section has two fields and the last one is AUDIO_UPLOAD_BOX.
          f_last = form_section.fields.last
          if f_last.type == Field::AUDIO_UPLOAD_BOX
            blank = blank && formObject["recorded_audio"].blank?
          end
          return blank
        end
      end
    end
    #If there is no field in the section, assumed as invalid section, section should have at least one field.
    false
  end

end
