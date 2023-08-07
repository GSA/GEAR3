package main

import "time"

type ArlAlignment struct {
	CreatedDate             string           `json:"createdDate"`
	DeleteReason            string           `json:"deleteReason"`
	ID                      string           `json:"id"`
	IDArl                   string           `json:"idArl"`
	IDLegacy                int              `json:"idLegacy"`
	IsToBeDeleted           bool             `json:"isToBeDeleted"`
	ReplacementID           string           `json:"replacementId"`
	ReplacementIDLegacy     int              `json:"replacementIdLegacy"`
	SoftwareProductID       string           `json:"softwareProductId"`
	SoftwareProductIDLegacy int              `json:"softwareProductIdLegacy"`
	SoftwareReleaseID       string           `json:"softwareReleaseId"`
	SoftwareReleaseIDLegacy int              `json:"softwareReleaseIdLegacy"`
	SynchronizedDate        string           `json:"synchronizedDate"`
	ToBeDeletedOn           string           `json:"toBeDeletedOn"`
	UpdatedDate             string           `json:"updatedDate"`
	SoftwareRelease         *SoftwareRelease `json:"softwareRelease"`
}

type Cpe struct {
	CpeEdition          string             `json:"cpeEdition"`
	CpeLanguage         string             `json:"cpeLanguage"`
	CpePart             string             `json:"cpePart"`
	CpeProduct          string             `json:"cpeProduct"`
	CpeTitle            string             `json:"cpeTitle"`
	CpeUpdate           string             `json:"cpeUpdate"`
	CpeVendor           string             `json:"cpeVendor"`
	CpeVersion          string             `json:"cpeVersion"`
	CreatedDate         string             `json:"createdDate"`
	CreatedDateVt       string             `json:"createdDateVt"`
	CveCount            int                `json:"cveCount"`
	CvssScoreMax        string             `json:"cvssScoreMax"`
	CvssSeverityMax     int                `json:"cvssSeverityMax"`
	Definition          string             `json:"definition"`
	DeleteReason        string             `json:"deleteReason"`
	DeprecatedByNvdID   int                `json:"deprecatedByNvdId"`
	EditionVt           string             `json:"editionVt"`
	ID                  string             `json:"id"`
	IDLegacy            int                `json:"idLegacy"`
	IsToBeDeleted       bool               `json:"isToBeDeleted"`
	LastUpdatedDate     string             `json:"lastUpdatedDate"`
	NvdID               int                `json:"nvdId"`
	ReplacementID       string             `json:"replacementId"`
	ReplacementIDLegacy int                `json:"replacementIdLegacy"`
	SynchronizedDate    string             `json:"synchronizedDate"`
	TitleLanguageVt     string             `json:"titleLanguageVt"`
	ToBeDeletedOn       string             `json:"toBeDeletedOn"`
	UpdatedDate         string             `json:"updatedDate"`
	UpdatedDateVt       string             `json:"updatedDateVt"`
	URI                 string             `json:"uri"`
	URI23               string             `json:"uri23"`
	HardwareModels      []*HardwareModel   `json:"hardwareModels"`
	SoftwareReleases    []*SoftwareRelease `json:"softwareReleases"`
}

type CveRule struct {
	CodeName         string `json:"codeName"`
	Count            int    `json:"count"`
	CreatedDate      string `json:"createdDate"`
	Criticality      int    `json:"criticality"`
	CriticalityLabel string `json:"criticalityLabel"`
	DeleteReason     string `json:"deleteReason"`
	Description      string `json:"description"`
	ID               string `json:"id"`
	IsToBeDeleted    bool   `json:"isToBeDeleted"`
	RuleID           int    `json:"ruleId"`
	SynchronizedDate string `json:"synchronizedDate"`
	ToBeDeletedOn    string `json:"toBeDeletedOn"`
	UpdatedDate      string `json:"updatedDate"`
}

type HardwareFamily struct {
	CreatedDate         string `json:"createdDate"`
	DeleteReason        string `json:"deleteReason"`
	ID                  string `json:"id"`
	IsDesupported       bool   `json:"isDesupported"`
	IsDiscontinued      bool   `json:"isDiscontinued"`
	IsToBeDeleted       bool   `json:"isToBeDeleted"`
	Name                string `json:"name"`
	ReplacementID       string `json:"replacementId"`
	ReplacementIDLegacy int    `json:"replacementIdLegacy"`
	SynchronizedDate    string `json:"synchronizedDate"`
	ToBeDeletedOn       string `json:"toBeDeletedOn"`
	UpdatedDate         string `json:"updatedDate"`
}

type HardwareLifecycle struct {
	CreatedDate                  string         `json:"createdDate"`
	DeleteReason                 string         `json:"deleteReason"`
	GeneralAvailability          string         `json:"generalAvailability"`
	GeneralAvailabilityDate      string         `json:"generalAvailabilityDate"`
	GeneralAvailabilityException string         `json:"generalAvailabilityException"`
	ID                           string         `json:"id"`
	IDLegacy                     int            `json:"idLegacy"`
	Introduction                 string         `json:"introduction"`
	IntroductionDate             string         `json:"introductionDate"`
	IntroductionException        string         `json:"introductionException"`
	IsToBeDeleted                bool           `json:"isToBeDeleted"`
	LastAvailability             string         `json:"lastAvailability"`
	LastAvailabilityDate         string         `json:"lastAvailabilityDate"`
	LastAvailabilityException    string         `json:"lastAvailabilityException"`
	Obsolete                     string         `json:"obsolete"`
	ObsoleteDate                 string         `json:"obsoleteDate"`
	ObsoleteException            string         `json:"obsoleteException"`
	ReplacementID                string         `json:"replacementId"`
	ReplacementIDLegacy          int            `json:"replacementIdLegacy"`
	SynchronizedDate             string         `json:"synchronizedDate"`
	ToBeDeletedOn                string         `json:"toBeDeletedOn"`
	UpdatedDate                  string         `json:"updatedDate"`
	HardwareModel                *HardwareModel `json:"hardwareModel"`
}

type HardwareModel struct {
	Cloud                       string                       `json:"cloud"`
	CreatedDate                 string                       `json:"createdDate"`
	DeleteReason                string                       `json:"deleteReason"`
	ID                          string                       `json:"id"`
	IDLegacy                    int                          `json:"idLegacy"`
	IsDesupported               bool                         `json:"isDesupported"`
	IsDiscontinued              bool                         `json:"isDiscontinued"`
	IsToBeDeleted               bool                         `json:"isToBeDeleted"`
	Name                        string                       `json:"name"`
	ReplacementID               string                       `json:"replacementId"`
	ReplacementIDLegacy         int                          `json:"replacementIdLegacy"`
	SupportedOs                 string                       `json:"supportedOs"`
	SynchronizedDate            time.Time                    `json:"synchronizedDate"`
	ToBeDeletedOn               string                       `json:"toBeDeletedOn"`
	UpdatedDate                 string                       `json:"updatedDate"`
	HardwareLifecycle           *HardwareLifecycle           `json:"hardwareLifecycle"`
	HardwareModelConnectivities []*HardwareModelConnectivity `json:"hardwareModelConnectivities"`
	HardwareModelPower          *HardwareModelPower          `json:"hardwareModelPower"`
	HardwareModelProfiles       []*HardwareModelProfile      `json:"hardwareModelProfiles"`
	HardwareProduct             *HardwareProduct             `json:"hardwareProduct"`
}

type HardwareModelConnectivity struct {
	CreatedDate         string        `json:"createdDate"`
	DeleteReason        string        `json:"deleteReason"`
	ID                  string        `json:"id"`
	IDLegacy            int           `json:"idLegacy"`
	IsToBeDeleted       bool          `json:"isToBeDeleted"`
	Name                string        `json:"name"`
	ReplacementID       string        `json:"replacementId"`
	ReplacementIDLegacy int           `json:"replacementIdLegacy"`
	Standard            string        `json:"standard"`
	StandardVersion     string        `json:"standardVersion"`
	SynchronizedDate    string        `json:"synchronizedDate"`
	ToBeDeletedOn       string        `json:"toBeDeletedOn"`
	Type                string        `json:"type"`
	UpdatedDate         string        `json:"updatedDate"`
	HardwareModel       HardwareModel `json:"hardwareModel"`
}

type HardwareModelPower struct {
	ACCurrentHighMax           float64        `json:"acCurrentHighMax"`
	ACCurrentHighMin           float64        `json:"acCurrentHighMin"`
	ACCurrentLowMax            float64        `json:"acCurrentLowMax"`
	ACCurrentLowMin            float64        `json:"acCurrentLowMin"`
	ACFrequencyMax             float64        `json:"acFrequencyMax"`
	ACFrequencyMin             float64        `json:"acFrequencyMin"`
	ACHeatDissipationAverage   string         `json:"acHeatDissipationAverage"`
	ACHeatDissipationMax       string         `json:"acHeatDissipationMax"`
	ACPhase                    int            `json:"acPhase"`
	ACPowerAverage             string         `json:"acPowerAverage"`
	ACPowerAverageUnit         string         `json:"acPowerAverageUnit"`
	ACPowerMax                 string         `json:"acPowerMax"`
	ACPowerMaxUnit             string         `json:"acPowerMaxUnit"`
	ACVoltageHighMax           float64        `json:"acVoltageHighMax"`
	ACVoltageHighMin           float64        `json:"acVoltageHighMin"`
	ACVoltageLowMax            float64        `json:"acVoltageLowMax"`
	ACVoltageLowMin            float64        `json:"acVoltageLowMin"`
	BatteryLife                int            `json:"batteryLife"`
	BatteryType                string         `json:"batteryType"`
	CreatedDate                string         `json:"createdDate"`
	DCCurrentHigh              float64        `json:"dcCurrentHigh"`
	DCCurrentLow               float64        `json:"dcCurrentLow"`
	DCHeatDissipationAverage   string         `json:"dcHeatDissipationAverage"`
	DCHeatDissipationMax       string         `json:"dcHeatDissipationMax"`
	DCPowerAverage             string         `json:"dcPowerAverage"`
	DCPowerMax                 string         `json:"dcPowerMax"`
	DCVoltageHigh              float64        `json:"dcVoltageHigh"`
	DCVoltageLow               float64        `json:"dcVoltageLow"`
	DeleteReason               string         `json:"deleteReason"`
	EmergencyPower             string         `json:"emergencyPower"`
	EPEAT                      string         `json:"epeat"`
	HasDedicatedCircuit        string         `json:"hasDedicatedCircuit"`
	ID                         string         `json:"id"`
	IDLegacy                   int            `json:"idLegacy"`
	IsEnergyStar               string         `json:"isEnergyStar"`
	IsToBeDeleted              bool           `json:"isToBeDeleted"`
	NonOperatingHumidityMax    float64        `json:"nonOperatingHumidityMax"`
	NonOperatingHumidityMin    float64        `json:"nonOperatingHumidityMin"`
	NonOperatingTemperatureMax float64        `json:"nonOperatingTemperatureMax"`
	NonOperatingTemperatureMin float64        `json:"nonOperatingTemperatureMin"`
	OperatingHumidityMax       float64        `json:"operatingHumidityMax"`
	OperatingHumidityMin       float64        `json:"operatingHumidityMin"`
	OperatingTemperatureMax    float64        `json:"operatingTemperatureMax"`
	OperatingTemperatureMin    float64        `json:"operatingTemperatureMin"`
	PlugType                   string         `json:"plugType"`
	PowerRating                string         `json:"powerRating"`
	ReplacementID              string         `json:"replacementId"`
	ReplacementIDLegacy        int            `json:"replacementIdLegacy"`
	SynchronizedDate           string         `json:"synchronizedDate"`
	ToBeDeletedOn              string         `json:"toBeDeletedOn"`
	UpdatedDate                string         `json:"updatedDate"`
	HardwareModel              *HardwareModel `json:"hardwareModel"`
}

type HardwareModelProfile struct {
	BoreSize            float64       `json:"boreSize"`
	CreatedDate         string        `json:"createdDate"`
	DeleteReason        string        `json:"deleteReason"`
	DepthMax            float64       `json:"depthMax"`
	DepthMin            float64       `json:"depthMin"`
	Diameter            float64       `json:"diameter"`
	HeightMax           float64       `json:"heightMax"`
	HeightMin           float64       `json:"heightMin"`
	ID                  string        `json:"id"`
	IDLegacy            int           `json:"idLegacy"`
	IsToBeDeleted       bool          `json:"isToBeDeleted"`
	Mounting            string        `json:"mounting"`
	Name                string        `json:"name"`
	ReplacementID       string        `json:"replacementId"`
	ReplacementIDLegacy int           `json:"replacementIdLegacy"`
	RoomSizeMin         float64       `json:"roomSizeMin"`
	SynchronizedDate    string        `json:"synchronizedDate"`
	ToBeDeletedOn       string        `json:"toBeDeletedOn"`
	UpdatedDate         string        `json:"updatedDate"`
	Volume              float64       `json:"volume"`
	WeightMax           float64       `json:"weightMax"`
	WeightMin           float64       `json:"weightMin"`
	WidthMax            float64       `json:"widthMax"`
	WidthMin            float64       `json:"widthMin"`
	HardwareModel       HardwareModel `json:"hardwareModel"`
}

type HardwareProduct struct {
	CreatedDate         string           `json:"createdDate"`
	DeleteReason        string           `json:"deleteReason"`
	ID                  string           `json:"id"`
	IDLegacy            int              `json:"idLegacy"`
	IsCloud             string           `json:"isCloud"`
	IsDesupported       bool             `json:"isDesupported"`
	IsDiscontinued      bool             `json:"isDiscontinued"`
	IsToBeDeleted       bool             `json:"isToBeDeleted"`
	Name                string           `json:"name"`
	ReplacementID       string           `json:"replacementId"`
	ReplacementIDLegacy int              `json:"replacementIdLegacy"`
	SynchronizedDate    string           `json:"synchronizedDate"`
	ToBeDeletedOn       string           `json:"toBeDeletedOn"`
	UpdatedDate         string           `json:"updatedDate"`
	HardwareFamily      *HardwareFamily  `json:"hardwareFamily"`
	HardwareModels      []*HardwareModel `json:"hardwareModels"`
	Manufacturer        *Manufacturer    `json:"manufacturer"`
	Taxonomy            *Taxonomy        `json:"taxonomy"`
}

type KbArticle struct {
	CreatedOn      string         `json:"createdOn"`
	DeleteReason   string         `json:"deleteReason"`
	Description    string         `json:"description"`
	Heading        string         `json:"heading"`
	ID             string         `json:"id"`
	IsToBeDeleted  bool           `json:"isToBeDeleted"`
	KbArticle      int            `json:"kbArticle"`
	KbArticleVtID  int            `json:"kbArticleVtId"`
	ManufacturerID string         `json:"manufacturerId"`
	OsSoftID       int            `json:"osSoftId"`
	PublishedOn    string         `json:"publishedOn"`
	ReplacementID  string         `json:"replacementId"`
	ToBeDeletedOn  string         `json:"toBeDeletedOn"`
	Vulnerability  *Vulnerability `json:"vulnerability"`
}

type Manufacturer struct {
	AcquiredDate        string             `json:"acquiredDate"`
	City                string             `json:"city"`
	Country             string             `json:"country"`
	CreatedDate         string             `json:"createdDate"`
	DeleteReason        string             `json:"deleteReason"`
	Description         string             `json:"description"`
	Email               string             `json:"email"`
	Employees           string             `json:"employees"`
	EmployeesDate       string             `json:"employeesDate"`
	Fax                 string             `json:"fax"`
	FiscalEndDate       string             `json:"fiscalEndDate"`
	ID                  string             `json:"id"`
	IDLegacy            int                `json:"idLegacy"`
	IsPubliclyTraded    string             `json:"isPubliclyTraded"`
	IsToBeDeleted       bool               `json:"isToBeDeleted"`
	KnownAs             string             `json:"knownAs"`
	Legal               string             `json:"legal"`
	Name                string             `json:"name"`
	OwnerID             string             `json:"ownerId"`
	OwnerIDLegacy       int                `json:"ownerIdLegacy"`
	Phone               string             `json:"phone"`
	ProfitsDate         string             `json:"profitsDate"`
	ProfitsPerYear      int                `json:"profitsPerYear"`
	ReplacementID       string             `json:"replacementId"`
	ReplacementIDLegacy int                `json:"replacementIdLegacy"`
	Revenue             int                `json:"revenue"`
	RevenueDate         string             `json:"revenueDate"`
	State               string             `json:"state"`
	Street              string             `json:"street"`
	Symbol              string             `json:"symbol"`
	SynchronizedDate    string             `json:"synchronizedDate"`
	Tier                int                `json:"tier"`
	ToBeDeletedOn       string             `json:"toBeDeletedOn"`
	UpdatedDate         string             `json:"updatedDate"`
	Website             string             `json:"website"`
	Zip                 string             `json:"zip"`
	HardwareFamilies    []*HardwareFamily  `json:"hardwareFamilies"`
	HardwareProducts    []*HardwareProduct `json:"hardwareProducts"`
	SoftwareFamilies    []*SoftwareFamily  `json:"softwareFamilies"`
	SoftwareProducts    []*SoftwareProduct `json:"softwareProducts"`
}

type Platform struct {
	CreatedDate              time.Time                  `json:"createdDate"`
	DeleteReason             string                     `json:"deleteReason"`
	ID                       string                     `json:"id"`
	IDLegacy                 int                        `json:"idLegacy"`
	IsToBeDeleted            bool                       `json:"isToBeDeleted"`
	Name                     string                     `json:"name"`
	ReplacementID            string                     `json:"replacementId"`
	ReplacementIDLegacy      int                        `json:"replacementIdLegacy"`
	SynchronizedDate         string                     `json:"synchronizedDate"`
	ToBeDeletedOn            string                     `json:"toBeDeletedOn"`
	UpdatedDate              time.Time                  `json:"updatedDate"`
	SoftwareReleasePlatforms []*SoftwareReleasePlatform `json:"softwareReleasePlatforms"`
}

type ScaOpenSource struct {
	ComponentID         string                `json:"componentId"`
	ComponentIDLegacy   int                   `json:"componentIdLegacy"`
	ComponentLicenses   *ComponentLicenseData `json:"componentLicenses"`
	CreatedDate         string                `json:"createdDate"`
	DeleteReason        string                `json:"deleteReason"`
	Description         string                `json:"description"`
	DisplayName         string                `json:"displayName"`
	ID                  string                `json:"id"`
	IDLegacy            int                   `json:"idLegacy"`
	IsToBeDeleted       bool                  `json:"isToBeDeleted"`
	Keywords            *KeywordsData         `json:"keywords"`
	Name                string                `json:"name"`
	Owner               string                `json:"owner"`
	ProjectID           string                `json:"projectId"`
	RegisteredDate      string                `json:"registeredDate"`
	ReplacementID       string                `json:"replacementId"`
	ReplacementIDLegacy int                   `json:"replacementIdLegacy"`
	Source              string                `json:"source"`
	SynchronizedDate    string                `json:"synchronizedDate"`
	Title               string                `json:"title"`
	ToBeDeletedOn       string                `json:"toBeDeletedOn"`
	UpdatedDate         string                `json:"updatedDate"`
	URL                 string                `json:"url"`
	Version             string                `json:"version"`
	VersionLicenses     *VersionLicenseData   `json:"versionLicenses"`
	VersionURL          string                `json:"versionUrl"`
	SoftwareRelease     *SoftwareRelease      `json:"softwareRelease"`
}

type ServiceNowClassMapping struct {
	Category            string   `json:"category"`
	ClassLabel          string   `json:"classLabel"`
	ClassName           string   `json:"className"`
	CreatedDate         string   `json:"createdDate"`
	DeleteReason        string   `json:"deleteReason"`
	ID                  string   `json:"id"`
	IDLegacy            int      `json:"idLegacy"`
	IsToBeDeleted       bool     `json:"isToBeDeleted"`
	ReplacementID       string   `json:"replacementId"`
	ReplacementIDLegacy int      `json:"replacementIdLegacy"`
	Subcategory         string   `json:"subcategory"`
	SynchronizedDate    string   `json:"synchronizedDate"`
	TaxonomyID          string   `json:"taxonomyId"`
	ToBeDeletedOn       string   `json:"toBeDeletedOn"`
	UpdatedDate         string   `json:"updatedDate"`
	Taxonomy            Taxonomy `json:"taxonomy"`
}

type SoftwareEdition struct {
	CreatedDate         string             `json:"createdDate"`
	DeleteReason        string             `json:"deleteReason"`
	ID                  string             `json:"id"`
	IDLegacy            int                `json:"idLegacy"`
	IsDesupported       bool               `json:"isDesupported"`
	IsDiscontinued      bool               `json:"isDiscontinued"`
	IsToBeDeleted       bool               `json:"isToBeDeleted"`
	Name                string             `json:"name"`
	Order               int                `json:"order"`
	ReplacementID       string             `json:"replacementId"`
	ReplacementIDLegacy int                `json:"replacementIdLegacy"`
	SynchronizedDate    string             `json:"synchronizedDate"`
	ToBeDeletedOn       string             `json:"toBeDeletedOn"`
	UpdatedDate         string             `json:"updatedDate"`
	SoftwareProduct     *SoftwareProduct   `json:"softwareProduct"`
	SoftwareReleases    []*SoftwareRelease `json:"softwareReleases"`
}

type SoftwareFamily struct {
	CreatedDate         string             `json:"createdDate"`
	DeleteReason        string             `json:"deleteReason"`
	ID                  string             `json:"id"`
	IsDesupported       bool               `json:"isDesupported"`
	IsDiscontinued      bool               `json:"isDiscontinued"`
	IsToBeDeleted       bool               `json:"isToBeDeleted"`
	Name                string             `json:"name"`
	ReplacementID       string             `json:"replacementId"`
	ReplacementIDLegacy int                `json:"replacementIdLegacy"`
	SynchronizedDate    string             `json:"synchronizedDate"`
	ToBeDeletedOn       string             `json:"toBeDeletedOn"`
	UpdatedDate         string             `json:"updatedDate"`
	Manufacturer        Manufacturer       `json:"manufacturer"`
	SoftwareProducts    []*SoftwareProduct `json:"softwareProducts"`
	Taxonomy            Taxonomy           `json:"taxonomy"`
}

type SoftwareLifecycle struct {
	CreatedDate                  string                    `json:"createdDate"`
	DeleteReason                 string                    `json:"deleteReason"`
	EndOfLife                    string                    `json:"endOfLife"`
	EndOfLifeCalculatedCase      string                    `json:"endOfLifeCalculatedCase"`
	EndOfLifeDate                string                    `json:"endOfLifeDate"`
	EndOfLifeDateCalculated      string                    `json:"endOfLifeDateCalculated"`
	EndOfLifeException           string                    `json:"endOfLifeException"`
	EndOfLifeSupportLevel        string                    `json:"endOfLifeSupportLevel"`
	GeneralAvailability          string                    `json:"generalAvailability"`
	GeneralAvailabilityDate      string                    `json:"generalAvailabilityDate"`
	GeneralAvailabilityException string                    `json:"generalAvailabilityException"`
	ID                           string                    `json:"id"`
	IDLegacy                     int                       `json:"idLegacy"`
	IsToBeDeleted                bool                      `json:"isToBeDeleted"`
	Obsolete                     string                    `json:"obsolete"`
	ObsoleteCalculatedCase       string                    `json:"obsoleteCalculatedCase"`
	ObsoleteDate                 string                    `json:"obsoleteDate"`
	ObsoleteDateCalculated       string                    `json:"obsoleteDateCalculated"`
	ObsoleteException            string                    `json:"obsoleteException"`
	ObsoleteSupportLevel         string                    `json:"obsoleteSupportLevel"`
	ReplacementID                string                    `json:"replacementId"`
	ReplacementIDLegacy          int                       `json:"replacementIdLegacy"`
	SoftwareSupportStage         *SoftwareSupportStageData `json:"softwareSupportStage"`
	SynchronizedDate             string                    `json:"synchronizedDate"`
	ToBeDeletedOn                string                    `json:"toBeDeletedOn"`
	UpdatedDate                  string                    `json:"updatedDate"`
	SoftwareRelease              *SoftwareRelease          `json:"softwareRelease"`
}

type SoftwareMarketVersion struct {
	CreatedDate         string             `json:"createdDate"`
	DeleteReason        string             `json:"deleteReason"`
	ID                  string             `json:"id"`
	IDLegacy            int                `json:"idLegacy"`
	IsDesupported       bool               `json:"isDesupported"`
	IsDiscontinued      bool               `json:"isDiscontinued"`
	IsToBeDeleted       bool               `json:"isToBeDeleted"`
	Name                string             `json:"name"`
	Order               int                `json:"ReleaseOrder"`
	ReplacementID       string             `json:"replacementId"`
	ReplacementIDLegacy int                `json:"replacementIdLegacy"`
	SynchronizedDate    string             `json:"synchronizedDate"`
	ToBeDeletedOn       string             `json:"toBeDeletedOn"`
	UpdatedDate         string             `json:"updatedDate"`
	SoftwareProduct     *SoftwareProduct   `json:"softwareProduct"`
	SoftwareVersions    []*SoftwareVersion `json:"softwareVersions"`
}

type SoftwareProductLink struct {
	Cloud                         string           `json:"cloud"`
	CreatedDate                   string           `json:"createdDate"`
	DeleteReason                  string           `json:"deleteReason"`
	FormerSoftwareProductID       string           `json:"formerSoftwareProductId"`
	FormerSoftwareProductIDLegacy int              `json:"formerSoftwareProductIdLegacy"`
	ID                            string           `json:"id"`
	IDLegacy                      int              `json:"idLegacy"`
	IsToBeDeleted                 bool             `json:"isToBeDeleted"`
	LaterSoftwareProductID        string           `json:"laterSoftwareProductId"`
	LaterSoftwareProductIDLegacy  int              `json:"laterSoftwareProductIdLegacy"`
	LatestSoftwareProductID       string           `json:"latestSoftwareProductId"`
	LatestSoftwareProductIDLegacy int              `json:"latestSoftwareProductIdLegacy"`
	OldestSoftwareProductID       string           `json:"oldestSoftwareProductId"`
	OldestSoftwareProductIDLegacy int              `json:"oldestSoftwareProductIdLegacy"`
	ReplacementID                 string           `json:"replacementId"`
	ReplacementIDLegacy           int              `json:"replacementIdLegacy"`
	SoftwareCloudID               string           `json:"softwareCloudId"`
	SoftwareCloudIDLegacy         int              `json:"softwareCloudIdLegacy"`
	SoftwareOnPremID              string           `json:"softwareOnPremId"`
	SoftwareOnPremIDLegacy        int              `json:"softwareOnPremIdLegacy"`
	SynchronizedDate              time.Time        `json:"synchronizedDate"`
	ToBeDeletedOn                 string           `json:"toBeDeletedOn"`
	UpdatedDate                   string           `json:"updatedDate"`
	SoftwareProduct               *SoftwareProduct `json:"softwareProduct"`
}

type SoftwareProduct struct {
	ID                  string         `json:"id" gorm:"column:id"`
	Alias               string         `json:"alias" gorm:"column:alias"`
	Application         string         `json:"application" gorm:"column:application"`
	Cloud               string         `json:"cloud"`
	Component           string         `json:"component"`
	CreatedDate         time.Time      `json:"createdDate" gorm:"column:createdDate"`
	DeleteReason        string         `json:"deleteReason" gorm:"column:deleteReason"`
	IDLegacy            int            `json:"idLegacy" gorm:"column:idLegacy"`
	IsDesupported       bool           `json:"isDesupported" gorm:"column:isDesupported"`
	IsDiscontinued      bool           `json:"isDiscontinued" gorm:"column:isDiscontinued"`
	IsFamilyInFullName  bool           `json:"isFamilyInFullName" gorm:"column:isFamilyInFullName"`
	IsSuite             bool           `json:"isSuite" gorm:"column:isSuite"`
	IsToBeDeleted       bool           `json:"isToBeDeleted" gorm:"column:isToBeDeleted"`
	Name                string         `json:"name" gorm:"column:name"`
	ProductLicensable   int            `json:"productLicensable" gorm:"column:productLicensable"`
	ReplacementID       string         `json:"replacementId" gorm:"column:replacementId"`
	ReplacementIDLegacy int            `json:"replacementIdLegacy" gorm:"column:replacementIdLegacy"`
	SynchronizedDate    string         `json:"synchronizedDate" gorm:"column:synchronizedDate"`
	ToBeDeletedOn       string         `json:"toBeDeletedOn" gorm:"column:toBeDeletedOn"`
	UpdatedDate         time.Time      `json:"updatedDate" gorm:"column:updatedDate"`
	Manufacturer        map[string]any `json:"manufacturer" gorm:"column:manufacturer;type:json"`
	SoftwareFamily      map[string]any `json:"softwareFamily" gorm:"column:softwareFamily;type:json"`
	Taxonomy            map[string]any `json:"taxonomy" gorm:"column:taxonomy;type:json"`
}

type SoftwareRelease struct {
	Application                  string                     `json:"application"`
	Cloud                        string                     `json:"cloud"`
	CreatedDate                  string                     `json:"createdDate"`
	DeleteReason                 string                     `json:"deleteReason"`
	ID                           string                     `json:"id"`
	IDLegacy                     int                        `json:"idLegacy"`
	IsDesupported                bool                       `json:"isDesupported"`
	IsDiscontinued               bool                       `json:"isDiscontinued"`
	IsLicensable                 bool                       `json:"isLicensable"`
	IsMajor                      bool                       `json:"isMajor"`
	IsToBeDeleted                bool                       `json:"isToBeDeleted"`
	MajorSoftwareReleaseID       string                     `json:"majorSoftwareReleaseId"`
	MajorSoftwareReleaseIDLegacy int                        `json:"majorSoftwareReleaseIdLegacy"`
	Name                         string                     `json:"name"`
	PatchLevel                   string                     `json:"patchLevel"`
	ReplacementID                string                     `json:"replacementId"`
	ReplacementIDLegacy          int                        `json:"replacementIdLegacy"`
	SynchronizedDate             string                     `json:"synchronizedDate"`
	ToBeDeletedOn                string                     `json:"toBeDeletedOn"`
	UpdatedDate                  string                     `json:"updatedDate"`
	ScaOpenSource                ScaOpenSource              `json:"scaOpenSource"`
	SoftwareEdition              SoftwareEdition            `json:"softwareEdition"`
	SoftwareLifecycle            SoftwareLifecycle          `json:"softwareLifecycle"`
	SoftwareProduct              *SoftwareProduct           `json:"softwareProduct"`
	SoftwareReleaseLinks         []*SoftwareReleaseLink     `json:"softwareReleaseLinks"`
	SoftwareReleasePlatforms     []*SoftwareReleasePlatform `json:"softwareReleasePlatforms"`
	SoftwareVersion              SoftwareVersion            `json:"softwareVersion"`
}

type SoftwareReleaseLink struct {
	CreatedDate                   string          `json:"createdDate"`
	DeleteReason                  string          `json:"deleteReason"`
	FormerSoftwareReleaseID       string          `json:"formerSoftwareReleaseId"`
	FormerSoftwareReleaseIDLegacy int             `json:"formerSoftwareReleaseIdLegacy"`
	ID                            string          `json:"id"`
	IDLegacy                      int             `json:"idLegacy"`
	IsToBeDeleted                 bool            `json:"isToBeDeleted"`
	LaterSoftwareReleaseID        string          `json:"laterSoftwareReleaseId"`
	LaterSoftwareReleaseIDLegacy  int             `json:"laterSoftwareReleaseIdLegacy"`
	LatestSoftwareReleaseID       string          `json:"latestSoftwareReleaseId"`
	LatestSoftwareReleaseIDLegacy int             `json:"latestSoftwareReleaseIdLegacy"`
	OldestSoftwareReleaseID       string          `json:"oldestSoftwareReleaseId"`
	OldestSoftwareReleaseIDLegacy int             `json:"oldestSoftwareReleaseIdLegacy"`
	ReplacementID                 string          `json:"replacementId"`
	ReplacementIDLegacy           int             `json:"replacementIdLegacy"`
	SynchronizedDate              time.Time       `json:"synchronizedDate"`
	ToBeDeletedOn                 string          `json:"toBeDeletedOn"`
	UpdatedDate                   string          `json:"updatedDate"`
	SoftwareRelease               SoftwareRelease `json:"softwareRelease"`
}

type SoftwareReleasePlatform struct {
	CreatedDate         string          `json:"createdDate"`
	DeleteReason        string          `json:"deleteReason"`
	ID                  string          `json:"id"`
	IDLegacy            int             `json:"idLegacy"`
	IsDesupported       bool            `json:"isDesupported"`
	IsDiscontinued      bool            `json:"isDiscontinued"`
	IsToBeDeleted       bool            `json:"isToBeDeleted"`
	PlatformLabel       string          `json:"platformLabel"`
	PlatformType        string          `json:"platformType"`
	ReplacementID       string          `json:"replacementId"`
	ReplacementIDLegacy int             `json:"replacementIdLegacy"`
	SynchronizedDate    string          `json:"synchronizedDate"`
	ToBeDeletedOn       string          `json:"toBeDeletedOn"`
	UpdatedDate         string          `json:"updatedDate"`
	Platform            Platform        `json:"platform"`
	SoftwareRelease     SoftwareRelease `json:"softwareRelease"`
}

type SoftwareVersion struct {
	CreatedDate            time.Time             `json:"createdDate"`
	DeleteReason           string                `json:"deleteReason"`
	ID                     string                `json:"id"`
	IDLegacy               int                   `json:"idLegacy"`
	IsDesupported          bool                  `json:"isDesupported"`
	IsDiscontinued         bool                  `json:"isDiscontinued"`
	IsMajor                bool                  `json:"isMajor"`
	IsToBeDeleted          bool                  `json:"isToBeDeleted"`
	MajorSoftwareVersionID string                `json:"majorSoftwareVersionId"`
	MajorVersionIDLegacy   int                   `json:"majorVersionIdLegacy"`
	Name                   string                `json:"name"`
	Order                  int                   `json:"ReleaseOrder"`
	PatchLevel             string                `json:"patchLevel"`
	ReplacementID          string                `json:"replacementId"`
	ReplacementIDLegacy    int                   `json:"replacementIdLegacy"`
	SynchronizedDate       string                `json:"synchronizedDate"`
	ToBeDeletedOn          string                `json:"toBeDeletedOn"`
	UpdatedDate            time.Time             `json:"updatedDate"`
	VersionStage           string                `json:"versionStage"`
	SoftwareMarketVersion  SoftwareMarketVersion `json:"softwareMarketVersion"`
	SoftwareProduct        SoftwareProduct       `json:"softwareProduct"`
	SoftwareReleases       []*SoftwareRelease    `json:"softwareReleases"`
}

type Taxonomy struct {
	ID                  string `json:"id"`
	Category            string `json:"category"`
	CategoryGroup       string `json:"categoryGroup"`
	CategoryID          string `json:"categoryId"`
	CategoryIDLegacy    int    `json:"categoryIdLegacy"`
	CreatedDate         string `json:"createdDate"`
	DeleteReason        string `json:"deleteReason"`
	Description         string `json:"description"`
	IDLegacy            int    `json:"idLegacy"`
	IsToBeDeleted       bool   `json:"isToBeDeleted"`
	ReplacementID       string `json:"replacementId"`
	ReplacementIDLegacy int    `json:"replacementIdLegacy"`
	SoftwareOrHardware  string `json:"softwareOrHardware"`
	Subcategory         string `json:"subcategory"`
	SynchronizedDate    string `json:"synchronizedDate"`
	ToBeDeletedOn       string `json:"toBeDeletedOn"`
	UpdatedDate         string `json:"updatedDate"`
}

type TechnopediaVersion struct {
	Legal       string `json:"legal"`
	ReleaseDate string `json:"releaseDate"`
	Version     string `json:"version"`
}

type Threat struct {
	CreatedDate      string        `json:"createdDate"`
	DeleteReason     string        `json:"deleteReason"`
	ExploitScore     float64       `json:"exploitScore"`
	ID               string        `json:"id"`
	IsToBeDeleted    bool          `json:"isToBeDeleted"`
	SynchronizedDate string        `json:"synchronizedDate"`
	ToBeDeletedOn    string        `json:"toBeDeletedOn"`
	UpdatedDate      string        `json:"updatedDate"`
	Vulnerability    Vulnerability `json:"vulnerability"`
}

type Vulnerability struct {
	Count              string             `json:"count"`
	Cpes               []*CpeData         `json:"cpes"`
	CreatedDate        string             `json:"createdDate"`
	Criticality        int                `json:"criticality"`
	CriticalityLabel   string             `json:"criticalityLabel"`
	Cves               []*CveData         `json:"cves"`
	Cvss3Score         string             `json:"cvss3Score"`
	CvssScore          string             `json:"cvssScore"`
	CvssVector         string             `json:"cvssVector"`
	DeleteReason       string             `json:"deleteReason"`
	Description        string             `json:"description"`
	DisclosureDate     string             `json:"disclosureDate"`
	DiscoveryDate      string             `json:"discoveryDate"`
	ExploitPublishDate string             `json:"exploitPublishDate"`
	ID                 string             `json:"id"`
	IsToBeDeleted      bool               `json:"isToBeDeleted"`
	Language           string             `json:"language"`
	LanguageID         int                `json:"languageId"`
	OsSoftIDs          []int              `json:"osSoftIds"`
	Others             []int              `json:"others"`
	ReleasedDate       string             `json:"releasedDate"`
	ReplacementID      string             `json:"replacementId"`
	Revision           string             `json:"revision"`
	SaID               string             `json:"saId"`
	Solution           string             `json:"solution"`
	SolutionStatus     string             `json:"solutionStatus"`
	Status             int                `json:"status"`
	SynchronizedDate   string             `json:"synchronizedDate"`
	Title              string             `json:"title"`
	ToBeDeletedOn      string             `json:"toBeDeletedOn"`
	TopPlace           string             `json:"topPlace"`
	UpdatedDate        string             `json:"updatedDate"`
	VulnID             int                `json:"vulnId"`
	WhereTypeID        string             `json:"whereTypeId"`
	WhereTypeName      string             `json:"whereTypeName"`
	ZeroDay            int                `json:"zeroDay"`
	KBArticle          *KbArticle         `json:"kbArticle"`
	SoftwareReleases   []*SoftwareRelease `json:"softwareReleases"`
	Threat             *Threat            `json:"threat"`
	CustomSubTypes     *CustomSubTypes    `json:"customSubTypes"`
}

type CpeData struct {
	CpeID  string `json:"cpeId"`
	CpeURI string `json:"cpeUri"`
}

type CustomSubTypes struct {
	ComponentLicenseData     ComponentLicenseData     `json:"componentLicenseData"`
	KeywordsData             KeywordsData             `json:"keywordsData"`
	VersionLicenseData       VersionLicenseData       `json:"versionLicenseData"`
	SoftwareSupportStageData SoftwareSupportStageData `json:"softwareSupportStageData"`
	CpeData                  CpeData                  `json:"cpeData"`
	CveData                  CveData                  `json:"cveData"`
}

type ComponentLicenseData struct {
	FamilyName     string `json:"familyName"`
	IsCopyleft     string `json:"isCopyleft"`
	IsPrimary      bool   `json:"isPrimary"`
	LicenseName    string `json:"licenseName"`
	LicenseType    string `json:"licenseType"`
	LicenseURL     string `json:"licenseUrl"`
	ShortName      string `json:"shortName"`
	SpdxIdentifier string `json:"spdxIdentifier"`
	SpdxName       string `json:"spdxName"`
}

type KeywordsData struct {
	ComponentsCategory     string `json:"componentsCategory"`
	ComponentsLanguage     string `json:"componentsLanguage"`
	ComponentsNormCategory string `json:"componentsNormCategory"`
	ComponentsNormLanguage string `json:"componentsNormLanguage"`
	ComponentsPlatform     string `json:"componentsPlatform"`
}

type VersionLicenseData struct {
	FamilyName     string `json:"familyName"`
	IsCopyleft     string `json:"isCopyleft"`
	IsPrimary      bool   `json:"isPrimary"`
	LicenseName    string `json:"licenseName"`
	LicenseType    string `json:"licenseType"`
	LicenseURL     string `json:"licenseUrl"`
	ShortName      string `json:"shortName"`
	SpdxIdentifier string `json:"spdxIdentifier"`
	SpdxName       string `json:"spdxName"`
}

type SoftwareSupportStageData struct {
	Definition           string    `json:"definition"`
	EndDate              time.Time `json:"endDate"`
	IDLegacy             int       `json:"idLegacy"`
	ManufacturerID       string    `json:"manufacturerId"`
	ManufacturerIDLegacy int       `json:"manufacturerIdLegacy"`
	Name                 string    `json:"name"`
	Order                int       `json:"ReleaseOrder"`
	Policy               string    `json:"policy"`
	PublishedEndDate     string    `json:"publishedEndDate"`
}

type CveData struct {
	CreatedDate  string   `json:"createdDate"`
	CveID        string   `json:"cveId"`
	CveRules     []int    `json:"cveRules"`
	CveScore     string   `json:"cveScore"`
	MalwareNames []string `json:"malwareNames"`
	UpdatedDate  string   `json:"updatedDate"`
}
