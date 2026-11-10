$OutputPath = Join-Path $PSScriptRoot "GSA_Pocs.csv"

Get-ADUser -Filter '(ObjectCategory -eq "user") -And (ObjectClass -eq "Person") -And (Enabled -eq "TRUE") -And (GivenName -like "*") -And (sn -like "*") -And (mail -like "*@gsa.gov")' `
  -Properties SamAccountName, GivenName, sn, mail, OfficePhone, Division, Title, employeeType, Enabled |
  Select-Object SamAccountName, GivenName, sn, mail, OfficePhone, Division, Title, employeeType, Enabled |
  Export-Csv -Path $OutputPath -NoTypeInformation -Force
