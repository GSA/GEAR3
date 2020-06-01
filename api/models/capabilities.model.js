class Capabilities {
  constructor(capability) {
    this.ID = capability.ID;
    this.Name = capability.Name;
    this.Description = capability.Description;
    this.ReferenceNum = capability.ReferenceNum;
    this.Parent = capability.Parent;
    this.old_Id = capability.old_Id;
  }
}

module.exports = Capabilities;