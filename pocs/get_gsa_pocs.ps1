Get-ADUser -Filter '(ObjectCategory -eq "user") -And (ObjectClass -eq "Person") -And (Enabled -eq "TRUE") -And (GivenName -like "*") -And (sn -like "*") -And (mail -like "*@gsa.gov")' -Properties SamAccountName, GivenName, sn, mail, OfficePhone, Division, Title, employeeType, Enabled, LastLogonDate | Where { $_.LastLogonDate -GT (Get-Date).AddDays(-30) } | select SamAccountName, GivenName, sn, mail, OfficePhone, Division, Title, employeeType, Enabled, LastLogonDate | Export-Csv -Path 'GSA_Pocs.csv' -NoTypeInformation