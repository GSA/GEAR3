import pdfplumber
import pandas as pd

pdf = pdfplumber.open("cyhy-GSA-2019-11-23-https-report.pdf")
websites = []

for page in pdf.pages:
    table = page.extract_table()
    
    if table is not None:
        for row in table:
            websites.append(row[0])
            
df = pd.DataFrame({'Website_Name': websites})
df.to_csv('websites.csv')