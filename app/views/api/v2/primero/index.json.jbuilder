# frozen_string_literal: true

json.data do
  json.sandbox_ui true # Rails.configuration.sandbox_ui
  json.agencies do
    json.array!(@agencies_with_logos) do |agency|
      json.unique_id agency.unique_id
      json.name agency.name
      json.logo_full rails_blob_path(agency.logo_full, only_path: true)
      json.logo_icon rails_blob_path(agency.logo_icon, only_path: true)
    end
  end
end.compact!
