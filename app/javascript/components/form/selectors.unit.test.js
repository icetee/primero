import { expect } from "chai";
import { fromJS } from "immutable";

import { OPTION_TYPES } from "./constants";
import * as selectors from "./selectors";

describe("Forms - Selectors", () => {
  const i18n = {
    t: value => value,
    locale: "en"
  };

  const lookup2 = { unique_id: "lookup-2", name: { en: "Lookup 2" } };
  const referToUsers = [
    {
      id: 1,
      user_name: "test_1"
    },
    {
      id: 2,
      user_name: "test_2"
    },
    {
      id: 3,
      user_name: "test_3"
    }
  ];

  const roles = [
    {
      id: 1,
      unique_id: "role-1",
      name: "Role 1",
      referral: true,
      form_section_unique_ids: ["test-1"]
    },
    {
      id: 2,
      unique_id: "role-2",
      name: "Role 2",
      referral: false,
      form_section_unique_ids: ["test-1", "test-2"]
    }
  ];

  const stateWithLookups = fromJS({
    records: {
      transitions: {
        referral: {
          users: referToUsers
        }
      }
    },
    forms: {
      options: {
        lookups: [
          {
            unique_id: "lookup-1",
            name: { en: "Lookup 1" }
          },
          lookup2
        ]
      }
    },
    application: {
      managedRoles: roles,
      roles
    },
    user: {
      permittedRoleUniqueIds: ["role-1"]
    }
  });

  describe("getOptions", () => {
    it("should return all lookup types including customs", () => {
      const options = selectors.getOptions(stateWithLookups, OPTION_TYPES.LOOKUPS, i18n);

      expect(options).to.deep.equal([
        {
          id: "lookup lookup-1",
          display_text: "Lookup 1",
          values: []
        },
        {
          id: "lookup lookup-2",
          display_text: "Lookup 2",
          values: []
        },
        {
          id: "Agency",
          display_text: "agency.label"
        },
        {
          id: "Location",
          display_text: "location.label"
        },
        {
          id: "User",
          display_text: "user.label"
        }
      ]);
    });

    it("should return the options for optionStringsText", () => {
      const optionStringsText = [
        { id: "submitted", display_text: "Submitted" },
        { id: "pending", display_text: "Pending" },
        { id: "no", display_text: "No" }
      ];
      const expected = optionStringsText;
      const result = selectors.getOptions(stateWithLookups, null, i18n, optionStringsText);

      expect(result).to.deep.equal(expected);
    });

    it("should return the options, even if we includes other keys that are not id or display_text", () => {
      const optionStringsText = [
        { id: "submitted", display_text: "Submitted", tooltip: "Submitted tooltip" },
        { id: "pending", display_text: "Pending", tooltip: "Pending tooltip" },
        { id: "no", display_text: "No", tooltip: "No tooltip" }
      ];
      const expected = optionStringsText;
      const result = selectors.getOptions(stateWithLookups, null, i18n, optionStringsText);

      expect(result).to.deep.equal(expected);
    });

    describe("when optionStringsSource is REFER_TO_USERS", () => {
      describe("with record", () => {
        const currRecord = fromJS({
          owned_by: "test_2"
        });

        const options = selectors.getOptions(stateWithLookups, OPTION_TYPES.REFER_TO_USERS, i18n, [], false, {
          currRecord
        });

        it("should return all users without the owned_by user that it's assigned to the record", () => {
          const expected = [
            {
              id: "test_1",
              display_text: "test_1"
            },
            {
              id: "test_3",
              display_text: "test_3"
            }
          ];

          expect(options).to.deep.equal(expected);
        });
      });

      describe("without record", () => {
        const options = selectors.getOptions(stateWithLookups, OPTION_TYPES.REFER_TO_USERS, i18n);

        it("should return all users without filter the owned_by user", () => {
          const expected = [
            {
              id: "test_1",
              display_text: "test_1"
            },
            {
              id: "test_2",
              display_text: "test_2"
            },
            {
              id: "test_3",
              display_text: "test_3"
            }
          ];

          expect(options).to.deep.equal(expected);
        });
      });
    });

    describe("when optionStringsSource is USER_GROUP_PERMITTED", () => {
      const allUserGroups = [
        {
          id: 1,
          unique_id: "test-1",
          name: "Test 1",
          disabled: false
        },
        {
          id: 2,
          unique_id: "test-2",
          name: "Test 2",
          disabled: false
        },
        {
          id: 3,
          unique_id: "test-3",
          name: "Test 3",
          disabled: false
        }
      ];

      describe("when user group permission is ALL", () => {
        const state = fromJS({
          application: {
            userGroups: allUserGroups
          },
          user: {
            roleGroupPermission: "all"
          }
        });

        it("should return all user groups", () => {
          const expected = [
            {
              id: "test-1",
              display_text: "Test 1",
              disabled: false
            },
            {
              id: "test-2",
              display_text: "Test 2",
              disabled: false
            },
            {
              id: "test-3",
              display_text: "Test 3",
              disabled: false
            }
          ];

          expect(selectors.getOptions(state, OPTION_TYPES.USER_GROUP_PERMITTED, i18n)).to.deep.equals(expected);
        });
      });

      describe("when user group permission is GROUP", () => {
        const state = fromJS({
          application: {
            userGroups: allUserGroups
          },
          user: {
            roleGroupPermission: "group",
            userGroupUniqueIds: ["test-1"]
          }
        });

        it("should return from application user groups only the ones that are assigned to the user", () => {
          const expected = [
            {
              id: "test-1",
              display_text: "Test 1",
              disabled: false
            },
            {
              id: "test-2",
              display_text: "Test 2",
              disabled: true
            },
            {
              id: "test-3",
              display_text: "Test 3",
              disabled: true
            }
          ];

          expect(selectors.getOptions(state, OPTION_TYPES.USER_GROUP_PERMITTED, i18n)).to.deep.equals(expected);
        });
      });
    });
  });

  describe("when optionStringsSource is ROLE_PERMITTED", () => {
    it("should disabled the roles that are not permitted for the current user", () => {
      const options = selectors.getOptions(stateWithLookups, OPTION_TYPES.ROLE_PERMITTED, i18n);

      const expected = [
        { id: "role-1", display_text: "Role 1", disabled: false },
        { id: "role-2", display_text: "Role 2", disabled: true }
      ];

      expect(options).to.deep.equal(expected);
    });
  });

  describe("getManagedRoleByUniqueId", () => {
    it("should return referral roles", () => {
      const expected = fromJS({
        id: 1,
        unique_id: "role-1",
        name: "Role 1",
        referral: true,
        form_section_unique_ids: ["test-1"]
      });

      expect(selectors.getManagedRoleByUniqueId(stateWithLookups, "role-1")).to.deep.equal(expected);
    });

    it("should return an empty object if we pass an invalid unique-id", () => {
      expect(selectors.getManagedRoleByUniqueId(stateWithLookups, "role-abc")).to.be.empty;
    });
  });

  describe("getFormGroupLookups", () => {
    const lookups = [
      {
        unique_id: "lookup-form-group-cp-case",
        name: { en: "Lookup 1" },
        values: []
      },
      {
        unique_id: "lookup-form-group-cp-incident",
        name: { en: "Lookup 2" },
        values: []
      },
      {
        unique_id: "lookup-form-group-gbv-incident",
        name: { en: "Lookup 3" },
        values: []
      }
    ];
    const stateWithLookupsFormGroup = fromJS({
      forms: {
        options: {
          lookups
        }
      }
    });

    it("should return formGroups lookups", () => {
      const result = selectors.getOptions(stateWithLookupsFormGroup, "FormGroupLookup", i18n);

      expect(result).to.deep.equal(lookups);
    });
  });
});
