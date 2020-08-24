import os
import sys
from dotenv import load_dotenv
load_dotenv()

import datetime 
import dateutil.relativedelta
import requests

import mysql.connector
import pandas as pd
from pandas.io.json import json_normalize

from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from smtplib import SMTP


#----- Environment Variables -----
env = os.getenv("ENVIRONMENT")

# Database credentials
db_host = os.getenv("DB_HOST")
default_schema = os.getenv("DB")
db_user = os.getenv("DB_USER")
db_pass = os.getenv("DB_PASS")

# SMTP port and server address
smtp_server = os.getenv("SMTP_SERVER")
smtp_port = os.getenv("SMTP_PORT")

# Email to replace with for development testing
dev_email = os.getenv("DEV_EMAIL")


#----- Global Parameters -----

# URLs for GEAR
if env == 'production':
    gear = "https://ea.gsa.gov/"
elif env == 'staging':
    gear = "https://stage.ea.gsa.gov/"
elif env == 'development':
    gear = "https://dev1.ea.gsa.gov/"
else:  # Ensure that the local server is running if developing locally
    gear = "http://localhost:3000/"

# Link for accessing GEAR Manager
gear_manager = gear + "#/gear_manager"

# Link for APIs
app_api_addr = gear + 'api/applications'
tech_api_addr = gear + 'api/it_standards'

# Current link for the form to request access to GEAR Manager 
gear_form = "https://docs.google.com/forms/d/e/1FAIpQLSdmvOEESbKRJ5z4GnOw9hMqWIAI8m5H8I0-tB4zU3mc3aeYPA/viewform?usp=sf_link"

if env == 'production':
    # Email address that you want to send the email from (can even be a made up address like no-reply@gsa.gov)
    from_email = "ea_planning@gsa.gov"

    # email address that you want replies to go to 
    reply_email = "ea_planning@gsa.gov"
else:
    # Set from and reply emails to dev_email
    from_email = dev_email
    reply_email = dev_email

# Log File Location
log_loc = "./log/"


#----- Functions -----

# Generic Email Function
def send_email(subject: str, to_email: str, txt_msg: str, html_msg: str) -> None:
    message = MIMEMultipart("alternative")
    message["Subject"] = subject
    message["From"] = from_email
    message["To"] = to_email
    message["Reply-to"] = reply_email
    
    text = f"""\
        Hi,
        {txt_msg}
        """

    html = f"""\
        <html>
          <head></head>
          <body>
            {html_msg}
          </body>
        </html>
        """

    # Turn these into plain/html MIMEText objects
    part1 = MIMEText(text, "plain")
    part2 = MIMEText(html, "html")

    # Add HTML/plain-text parts to MIMEMultipart message
    # The email client will try to render the last part first
    message.attach(part1)
    message.attach(part2)
    
    # Create secure connection with server and send email
    server = SMTP(smtp_server, smtp_port)
    server.sendmail(from_email, reply_email, message.as_string())


# Error Email to dev_email if something went wrong
def error_email(env: str, err_msg: str) -> None:
    subject = f"Error in Automation on the {env.capitalize()} Server"
    text = err_msg
    html = f"<p>{err_msg}</p>"
    
    send_email(subject = subject,
               to_email = dev_email,
               txt_msg = text,
               html_msg = html)
    
    
def send_email_for_poc(poc_df: pd.DataFrame, data: pd.DataFrame,
                       app_tech: str, poc_id: int) -> None:
    # Pull out the POC's records
    subset = poc_df[poc_df['POC_ID'] == poc_id].reset_index()
    
    # Not all apps will be in data, because we got rid of inactive or recently updated apps
    if app_tech == 'app':
        id_list = [id for id in set(subset['Application_ID']) if id in set(data['ID'])]
        name_list = [name for name in set(subset['Application']) if name in set(data['Name'])]
    else:
        id_list = [id for id in set(subset['Technology_ID']) if id in set(data['ID'])]
        name_list = [name for name in set(subset['Technology']) if name in set(data['Name'])]

    # If no data tied to POC, don't send an email
    if len(id_list) == 0:
        return

    # Create empty data frame
    output = pd.DataFrame(columns = ['value'])
    
    # Fill with data
    for my_id in id_list:
        sub = data[data['ID'] == my_id].T
        sub.columns = ['value']
        output = output.append(sub)
        # add empty row in between applications
        row = pd.Series({'value': ''}, name = '')
        output = output.append(row)

    # Compose and send message
    poc_name = subset.loc[0, 'Name'].split()[0]
    poc_email = subset.loc[0, 'Email']
    html_df = output.to_html(header = False)
    subject = f"Action Required: Update Your {'Application' if app_tech == 'app' else 'Technology'} in GEAR"
    
    text = f"""\
        Hi {poc_name},
        You're currently listed as a point of contact for one or more {'applications' if app_tech == 'app' else 'technologies'} in GEAR. Please 
        visit GEAR Manager to view your {'application' if app_tech == 'app' else 'technology'} details and make any necessary edits. If you 
        don't have access to GEAR Manager, please request access using the form in the "GEAR Manager"
        tab on the GEAR site. If you have any questions, or if you are no longer a POC, please reply to this email so 
        that we may update our records. Thank you!
        """
    
    html = f"""\
        <html>
          <head> </head>
          <body>
            <p>Hi {poc_name},
              <br><br>
              You're currently listed as a point of contact for the following application(s) in
              <a href={gear}>GEAR</a>:
              <ul>"""
    
    for name in name_list:
        html += f"""\
                <li>{name}</li>
            """
    
    html += f"""\
              </ul>
              Please look over the current information below. If you find anything
              to be incorrect, log in to <a href = {gear_manager}>GEAR manager</a> to edit your application.
              If you don't have access to GEAR Manager, request access <a href = {gear_form}>here</a>.
              If you are no longer a point of contact, please respond to this email so that we may update our records. 
              <br><br>
              Sincerely,
              <br> The Enterprise Architecture Team (IDRA)
            </p>
            <div>{html_df}</div>
          </body>
        </html>
        """
    
    send_email(subject = subject,
               to_email = poc_email,
               txt_msg = text,
               html_msg = html)
    
    # Write log of when email was sent
    write_log(f"Email sent to {poc_name} ({poc_email}) for {'application(s)' if app_tech == 'app' else 'technology(ies)'}")
    

# Get POC Info from Database
def get_pocs(app_tech: str):
    # Business and Technical POCs for Applications
    if app_tech == 'app':
        # This pulls out a table where each business poc and application pair has its own line 
        business = pd.read_sql("""
            SELECT 
            poc.Id       AS POC_ID,
            poc.Keyname  AS Name, 
            poc.Email    AS Email,
            app.Keyname  AS Application,
            app.Id       AS Application_ID

            FROM obj_poc AS poc

            RIGHT JOIN zk_application_business_poc ON poc.Id = zk_application_business_poc.obj_bus_poc_Id
            LEFT JOIN obj_application AS app       ON zk_application_business_poc.obj_application_Id = app.Id
            
            WHERE app.obj_application_status_Id <> 3
                AND app.ChangeDTG <= (now() - interval 6 month);
            """, con = cnx)
        
        # Same for technical pocs 
        technical = pd.read_sql("""
            SELECT 
            poc.Id       AS POC_ID,
            poc.Keyname  AS Name, 
            poc.Email    AS Email,
            app.Keyname  AS Application,
            app.Id       AS Application_ID

            from obj_poc AS poc

            RIGHT JOIN zk_application_technical_poc ON poc.Id = zk_application_technical_poc.obj_tech_poc_Id
            LEFT JOIN obj_application AS app        ON zk_application_technical_poc.obj_application_Id = app.Id
            
            WHERE app.obj_application_status_Id <> 3
                AND app.ChangeDTG <= (now() - interval 6 month);
            """, con = cnx)
        
        return business.append(technical, ignore_index = True)
    
    # POCs for IT Standards
    else:
        pocs = pd.read_sql("""
            SELECT 
            poc.Id       AS POC_ID,
            poc.Keyname  AS Name, 
            poc.Email    AS Email,
            tech.Keyname AS Technology,
            tech.Id      AS Technology_ID

            FROM obj_poc AS poc

            RIGHT JOIN zk_technology_poc     ON poc.Id = zk_technology_poc.obj_poc_Id
            LEFT JOIN obj_technology AS tech ON zk_technology_poc.obj_technology_Id = tech.Id

            WHERE tech.obj_technology_status_Id not in (1, 8, 9)
                AND tech.ChangeDTG <= (now() - interval 6 month);
            """, con = cnx)
        
        return pocs


def get_old_data(api_string: str, app_tech: str) -> pd.DataFrame:
    """
    Retrieve Application or IT Standards that have not been updated in the past 6 months
    
    Inputs:
        api_string (str): 
        app_tech (str):
        
    Output:
        pd.DataFrame: 
    """
    response = requests.get(api_string)
    
    if response.status_code == 200:
        data = json_normalize(response.json())
        data['ChangeDTG'] = pd.to_datetime(data['ChangeDTG'])
    else:
        error_msg = f"""Something went wrong with grabbing {app_tech} data.
                        Please check the connection with the database or credentials.
                        Aborting Emailing Automation.
                        API Request {response.status_code} Error"""
        error_email(env, error_msg)
        write_log(error_msg)
        sys.exit(error_msg)
        
    if app_tech == 'app':
        # Filter out Retired and Nulls
        data = data[data['Status'] != 'Retired']
    else:
        # Filter only Active and not Nulls
        data = data[~data['Status'].isin(['Sunsetting', 'Not yet submitted', 'Denied'])]
        
    # Only keep items that have not been updated in the last months
    now = datetime.datetime.now()
    six_months = now + dateutil.relativedelta.relativedelta(months = -6)
    data = data[data['ChangeDTG'] < six_months]

    return data.reset_index(drop = True)


# Connect to Database
def db_connect() -> mysql.connector.connection.MySQLConnection:
    # Change to secure DB when deployed
    return mysql.connector.connect(host = db_host,
                                  database = default_schema,
    #                               ssl_ca = './certs/ca.pem',
    #                               ssl_cert = './certs/client-cert.pem',
    #                               ssl_key = './certs/client-key.pem',
                                  user = db_user,
                                  password = db_pass)


def write_log(log_msg: str) -> None:
    current_date = datetime.datetime.now().strftime("%Y-%b-%d")
    now = datetime.datetime.now().strftime("%Y-%b-%d %H:%M:%S")
    file_name = f"{log_loc}email_automation-{current_date}.txt"
    
    if os.path.exists(file_name):
        append_write = 'a' # append if already exists
    else:
        os.makedirs(log_loc, exist_ok=True)
        append_write = 'w' # make a new file if not
    
    with open(file_name, append_write) as log_file:
        log_file.write(f"{now}: {log_msg}\n")



# Main Function
def main() -> None:
    # Get POCs
    app_pocs = get_pocs('app')
    tech_pocs = get_pocs('tech')
    if app_pocs is not None or tech_pocs is not None:
        write_log("Successfully Grabbed POC Data")
    
    # For non-production, pick email to replace with dev_email in order to test
    if env != 'production':
        app_replace_email = None
        
        # Find a name in both lists
        for name in set(app_pocs['Name']):
            if name in set(tech_pocs['Name']):
                app_replace_email = tech_replace_email = app_pocs[app_pocs['Name'] == name].iloc[0]['Email']
                app_replace_id = tech_replace_id = app_pocs[app_pocs['Name'] == name].iloc[0]['POC_ID']
                break

        # If none found, take the first
        if app_replace_email is None:
            app_replace_email = app_pocs.loc[0, 'Email']
            app_replace_id = app_pocs.loc[0, 'POC_ID']

            tech_replace_email = tech_pocs.loc[0, 'Email']
            tech_replace_id = tech_pocs.loc[0, 'POC_ID']
            

    # Get data older than 6 months
    app_data = get_old_data(app_api_addr, 'app')
    tech_data = get_old_data(tech_api_addr, 'tech')
    if app_data is not None or tech_data is not None:
        write_log("Successfully Grabbed App & Tech Data")
        
    
    # For testing purposes
    if env != 'production':
        # Replace POC email with dev email and send one email
        app_pocs = app_pocs.replace(to_replace=app_replace_email, value=dev_email)
        send_email_for_poc(app_pocs, app_data, 'app', app_replace_id)

        tech_pocs = tech_pocs.replace(to_replace=tech_replace_email, value=dev_email)
        send_email_for_poc(tech_pocs, tech_data, 'tech', tech_replace_id)

    # For actual emailing in production
    else:
        # Email App POCs
        for app_poc_id in set(app_pocs['POC_ID']):
            send_email_for_poc(app_pocs, app_data, 'app', app_poc_id)

        # Email IT STandards POCs
        for tech_poc_id in set(tech_pocs['POC_ID']):
            send_email_for_poc(tech_pocs, tech_data, 'tech', tech_poc_id)
    
    
if __name__ == "__main__":
    write_log("----- Starting Automated Emailing -----")
    
    # If any environment variables are missing, abort and write log file
    if None in [env, db_host, default_schema, db_user, db_pass,
                smtp_server, smtp_port, dev_email]:
        error_msg = "At least one environment variable is missing for automated emailing. Aborting automated emailing"
        write_log(error_msg)
        sys.exit(error_msg)
        
    write_log(f"Environment: {env}")
    
    # Connect to Database
    cnx = db_connect()
    
    # Error when connection to database fails
    if not cnx.is_connected():
        error_msg = "Connection to database failed. Please check connection credentials or network connection. Aborting automated emailing"

        write_log(error_msg)
        error_email(env, error_msg)
        sys.exit(error_msg)
    else:
        write_log(f"Connection to Database Successful from {env} to {db_host}")
    
    # Now ready for main function
    main()
    
    write_log("----- Finished Emailing POCs -----")