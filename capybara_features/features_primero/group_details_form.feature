#JIRA PRIMERO-318
#JIRA PRIMERO-243
#JIRA PRIMERO-365

@javascript @primero
Feature: Group Details Form
  As a User, I want to capture attributes of multiple groups of children rather than details by child
  so that this information can be used for analysis and reporting.

  Scenario: As a logged in user, I will create a incident for group details
    Given I am logged in as an admin with username "primero" and password "primero"
    When I access "incidents page"
    And I press the "Create a New Incident" button
    And I press the "Group Details" button
    And I fill in the 1st "Group Details Section" subform with the follow:
      | Description of the Group of Children                                        | Some Children Group    |
      | How many children were involved?                                            | 100                    |
      | What was the sex of the group of children involved?                         | <Select> Mixed         |
      | Into which age band did the children fall?                                  | <Select> ≥10<15 years  |
      | What were the ethnic affiliations of the children involved?                 | <Select> Ethnicity1    |
      | What was the nationality of the children involved?                          | <Select> Nationality2  |
      | What was the religious affiliation of the children involved?                | <Select> Religion3     |
      | What was the status of the children involved at the time of the violation ? | <Select> Refugee       |
    And I fill in the 2nd "Group Details Section" subform with the follow:
      | Description of the Group of Children                                        | Some Other Children Group |
      | How many children were involved?                                            | 200                       |
      | What was the sex of the group of children involved?                         | <Select> Unknown          |
      | Into which age band did the children fall?                                  | <Select> ≥15<18 years     |
      | What were the ethnic affiliations of the children involved?                 | <Select> Ethnicity2       |
      | What was the nationality of the children involved?                          | <Select> Nationality1     |
      | What was the religious affiliation of the children involved?                | <Select> Religion2        |
      | What was the status of the children involved at the time of the violation ? | <Select> Community Member |
    And I press "Save"
    Then I should see "Incident record successfully created" on the page
    And I should see in the 1st "Group Details Section" subform with the follow:
      | Description of the Group of Children                                        | Some Children Group |
      | How many children were involved?                                            | 100                 |
      | What was the sex of the group of children involved?                         | Mixed               |
      | Into which age band did the children fall?                                  | ≥10<15 years        |
      | What were the ethnic affiliations of the children involved?                 | Ethnicity1          |
      | What was the nationality of the children involved?                          | Nationality2        |
      | What was the religious affiliation of the children involved?                | Religion3           |
      | What was the status of the children involved at the time of the violation ? | Refugee             |
    And I should see in the 2nd "Group Details Section" subform with the follow:
      | Description of the Group of Children                                        | Some Other Children Group |
      | How many children were involved?                                            | 200                       |
      | What was the sex of the group of children involved?                         | Unknown                   |
      | Into which age band did the children fall?                                  | ≥15<18 years              |
      | What were the ethnic affiliations of the children involved?                 | Ethnicity2                |
      | What was the nationality of the children involved?                          | Nationality1              |
      | What was the religious affiliation of the children involved?                | Religion2                 |
      | What was the status of the children involved at the time of the violation ? | Community Member          |
