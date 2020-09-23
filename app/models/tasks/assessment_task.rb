module Tasks
  class AssessmentTask < Task
    def self.from_case(record)
      tasks = []
      if has_task?(record)
        tasks = [AssessmentTask.new(record)]
      end
      return tasks
    end

    def self.has_task?(record)
      record.assessment_due_date.present? &&
      record.assessment_requested_on.blank?
    end

    def self.field_name
      'assessment_due_date'
    end

    def due_date
      self.parent_case.assessment_due_date
    end

    def completion_field
      'assessment_requested_on'
    end
  end
end
