import * as constants from "./constants";

describe("<Nav>/components/<RecordInformation>- constants", () => {
  it("should have known constant", () => {
    const clonedConstants = { ...constants };

    ["NAME", "RECORD_INFORMATION_GROUP"].forEach(property => {
      expect(clonedConstants).to.have.property(property);
      delete clonedConstants[property];
    });

    expect(clonedConstants).to.deep.equal({});
  });
});
