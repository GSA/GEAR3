class Investment {
  constructor(investment) {
    this.ID = investment.ID;
    this.Name = investment.Name;
    this.Description = investment.Description;
    this.Comments = investment.Comments;
    this.Active = investment.Active;
    this.Budget_Year = investment.Budget_Year;
    this.UII = investment.UII;
    this.CreateDTG = investment.CreateDTG;
    this.ChangeDTG = investment.ChangeDTG;
    this.old_Id = investment.old_Id;
    this.Type = investment.Type;
    this.PSA = investment.PSA;
    this.SSA = investment.SSA;
    this.sec_service_area2 = investment.sec_service_area2;
    this.sec_service_area3 = investment.sec_service_area3;
    this.sec_service_area4 = investment.sec_service_area4;
    this.SSO = investment.SSO;
    this.InvManager = investment.InvManager;
    this.InvManagerEmail = investment.InvManagerEmail;
    this.POC = investment.POC;
  }
}

module.exports = Investment;