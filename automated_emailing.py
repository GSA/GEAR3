import datetime
from smtplib import SMTP
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from pandas.io.json import json_normalize
import pandas as pd
import sqlalchemy
from sqlalchemy import create_engine
import requests
import dateutil.relativedelta
import os
import sys
from dotenv import load_dotenv
load_dotenv()


# ----- Environment Variables -----
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


# ----- Global Parameters -----

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

# Current link for the form to request access to GEAR Manager
gear_form = "https://docs.google.com/forms/d/e/1FAIpQLSdmvOEESbKRJ5z4GnOw9hMqWIAI8m5H8I0-tB4zU3mc3aeYPA/viewform?usp=sf_link"

if env == 'production':
    # Email address that you want to send the email from (can even be a made up address like no-reply@gsa.gov)
    from_email = "ea_planning@gsa.gov"

    # Email address that you want replies to go to
    reply_email = "ea_planning@gsa.gov"
else:
    # Set from and reply emails to dev_email
    from_email = dev_email
    reply_email = dev_email

# Log File Location
log_loc = "./log/"


# ----- Functions -----

def send_email(subject: str, to_email: str, txt_msg: str, html_msg: str) -> None:
    """
    Send email through GSA's Gmail SMTP server
    Inputs:
      subject (str): Subject line
      to_email (str): Email address receiving the email
      txt_msg (str): Text-only version of the email being sent
      html_msg (str): HTML version of the email being sent
    Output:
      None
    """
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
          <head>
            <style>
              body {{
                  margin: 0;
                  font-family: Helvetica;
              }}
              table.dataframe {{
                  border-collapse: collapse;
                  border: none;
              }}
              table.dataframe tr {{
                  border: none;
              }}
              table.dataframe td, table.dataframe th {{
                  margin: 0;
                  border: 1px solid white;
                  padding-left: 0.25em;
                  padding-right: 0.25em;
              }}
              table.dataframe th:not(:empty) {{
                  background-color: #fec;
                  text-align: left;
                  font-weight: normal;
              }}
              table.dataframe tr:nth-child(2) th:empty {{
                  border-left: none;
                  border-right: 1px dashed #888;
              }}
              table.dataframe td {{
                  border: 2px solid #ccf;
                  background-color: #f4f4ff;
              }}
            </style>
          </head>
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


def error_email(err_msg: str) -> None:
    """
    Error email to dev_email notifying that something went wrong
    Inputs:
      err_msg (str): Error message to include in the body of the email
    Output:
      None
    """
    subject = f"Error in Automation on the {env.capitalize()} Server"
    text = err_msg
    html = f"<p>{err_msg}</p>"

    send_email(subject=subject,
               to_email=dev_email,
               txt_msg=text,
               html_msg=html)


def send_email_for_poc(poc_df: pd.DataFrame, data: pd.DataFrame,
                       app_tech: str, poc_id: int) -> None:
    """
    Compose email for POC respective to app or technology
    Inputs:
      poc_df (pd.DataFrame): Dataframe of POC info
      data (pd.DataFrame): Dataframe consisting of app or technology data
      app_tech (str): Flag denoting 'app' or 'tech'
      poc_id (int): ID of POC of interest
    Output:
      None
    """
    # Pull out the POC's records
    subset = poc_df[poc_df['POC_ID'] == poc_id].reset_index()

    # Not all apps will be in data, because we got rid of inactive or recently updated apps
    if app_tech == 'app':
        name_list = sorted([name for name in set(
            subset['Application']) if name in set(data['Name'])])
    else:
        name_list = sorted([name for name in set(
            subset['Technology']) if name in set(data['Name'])])

    # If no data tied to POC, don't send an email
    if len(name_list) == 0:
        return

    # Create empty data frame
    output = pd.DataFrame(columns=['value'])

    # Fill with data
    table_html = ''
    for i, name in enumerate(name_list):
        if i < 5:  # Only preview the first 5 items
            table_html += f"<h2>{name}</h2>\n"
            output = data[data['Name'] == name].T
            output.columns = ['value']
            table_html += f"{output.to_html(header=False)}\n<br>"

    # Compose and send message
    poc_name = subset.loc[0, 'Name'].split()[0]
    poc_email = subset.loc[0, 'Email']
    subject = f"Action Required: Update Your {'Application(s)' if app_tech == 'app' else 'Technology(ies)'} in GEAR"

    text = f"""\
        Hi {poc_name},
        You're currently listed as a point of contact for one or more {'applications' if app_tech == 'app' else 'technologies'} in GEAR.
        These automated emails are to ensure the data in GEAR is kept up-to-date as much as possible. It will help the enterprise plan and
        work as efficiently as possible based on this data. Follow these steps to edit or ceritfy that everything is correct:
        1) Please log in to GEAR Manager ({gear_manager}) and navigate to the {'"Business Applications"' if app_tech == 'app' else '"IT Standards"'} section.
        3) Find your {'application(s)' if app_tech == 'app' else 'technology(ies)'} using the search box just above the table.
        4) Click on the respective row on the table.
        5) On the bottom right of the popup window, click "Edit this Item".
        6) Make any necessary edits to any of the inputs on the form or certify that all the information is correct if no changes are needed. Ensure
           that you have filled out all the required fields and check the "Certify" box before saving.
        If you don't have access to GEAR Manager, please request access using the form from this URL ({gear_form}).
        If you have any questions, or if you are no longer a POC, please reply to this email so that we may update our records. These automated
        emails are to facilitate keeping data in GEAR up-to-date as much as possible to help the enterprise plan and work as efficiently as possible.
        Regards,
        The Enterprise Architecture Team (IDRA)
        """

    html = f"""\
        <p>Hi {poc_name},
          <br><br>
          You're currently listed as a point of contact for the following {'application(s)' if app_tech == 'app' else 'technology(ies)'} in
          <a href={gear}>GEAR</a> that haven't been updated in the past 6 months:
        </p>
        <ul>"""

    for name in name_list:
        html += f"""\
        <li>{name}</li>
        """

    html += f"""\
        </ul>
        <p>
          At the bottom of the email, you will find a preview of data for your {'application(s)' if app_tech == 'app' else 'technology(ies)'}.
          These automated emails are to ensure the data in GEAR is kept up-to-date as much as possible. It will help the enterprise plan and
          work as efficiently as possible based on this data. Follow these steps to edit or ceritfy that everything is correct:
        </p>
        <ol>
          <li>Please log in to <a href={gear_manager}>GEAR Manager</a> and navigate to the
              <b>{'"Business Applications"' if app_tech == 'app' else '"IT Standards"'}</b> section.
          </li>
          <li>Find your {'application(s)' if app_tech == 'app' else 'technology(ies)'} using the search box just above the table.</li>
          <li>Click on the respective row on the table.</li>
          <li>On the bottom right of the popup window, click <b>"Edit this Item"</b>.</li>
          <li>Make any necessary edits to any of the inputs on the form or certify that all the information is correct if no changes are needed.
            <b>Ensure that you have filled out all the required fields and check the "Certify" box before saving</b>.
          </li>
        </ol>
        <p>
          If you don't have access to GEAR Manager, request access <a href={gear_form}>here</a>. If you are no longer a point of contact, please
          respond to this email so that we may update our records.
          <br><br>
          Regards,
          <br>
          The Enterprise Architecture Team (IDRA)
        </p>
        <div>{table_html}</div>
        """

    send_email(subject=subject,
               to_email=poc_email,
               txt_msg=text,
               html_msg=html)

    # Write log of when email was sent
    write_log(
        f"Email sent to {poc_name} ({poc_email}) for {'application(s)' if app_tech == 'app' else 'technology(ies)'}")


def get_pocs(app_tech: str) -> pd.DataFrame:
    """
    Get POC info from database
    Inputs:
      app_tech (str): Flag denoting 'app' or 'tech'
    Output:
      pd.DataFrame: Dataframe of POCs connected to apps or technologies
    """
    # Business and Technical POCs for Applications
    if app_tech == 'app':
        # This pulls out a table where each business poc and application pair has its own line
        business = pd.read_sql("""
          SELECT
            poc.SamAccountName                            AS SamAccountName,
            CONCAT_WS(' ', poc.FirstName, poc.LastName)   AS Name,
            poc.Email                                     AS Email,
            app.Keyname                                   AS Application,
            app.Id                                        AS Application_ID
          FROM obj_ldap_poc AS poc
          RIGHT JOIN zk_application_business_poc ON poc.SamAccountName = zk_application_business_poc.obj_ldap_SamAccountName
          LEFT JOIN obj_application AS app       ON zk_application_business_poc.obj_application_Id = app.Id
          WHERE app.obj_application_status_Id <> 3
            AND app.ChangeDTG <= (now() - interval 6 month);
            """, con=connection)

        # Same for technical pocs
        technical = pd.read_sql("""
          SELECT
            poc.SamAccountName                            AS SamAccountName,
            CONCAT_WS(' ', poc.FirstName, poc.LastName)   AS Name,
            poc.Email                                     AS Email,
            app.Keyname                                   AS Application,
            app.Id                                        AS Application_ID
          FROM obj_ldap_poc AS poc
          RIGHT JOIN zk_application_technical_poc ON poc.SamAccountName = zk_application_technical_poc.obj_ldap_SamAccountName
          LEFT JOIN obj_application AS app        ON zk_application_technical_poc.obj_application_Id = app.Id
          WHERE app.obj_application_status_Id <> 3
            AND app.ChangeDTG <= (now() - interval 6 month);
            """, con=connection)

        pocs = business.append(technical, ignore_index=True)

        # Send error message if pocs are empty
        if pocs.empty:
            error_msg = "Business and Technical POCs for Applications could not be retrieved. Aborting..."
            error_routine(error_msg)
        else:
            write_log("Successfully Retrieved Application POC Data")

    # POCs for IT Standards
    else:
        pocs = pd.read_sql("""
          SELECT
            poc.SamAccountName                            AS SamAccountName,
            CONCAT_WS(' ', poc.FirstName, poc.LastName)   AS Name,
            poc.Email                                     AS Email,
            tech.Keyname                                  AS Technology,
            tech.Id                                       AS Technology_ID
          FROM obj_ldap_poc   AS poc
          RIGHT JOIN zk_technology_poc     ON poc.SamAccountName = zk_technology_poc.obj_ldap_SamAccountName
          LEFT JOIN obj_technology AS tech ON zk_technology_poc.obj_technology_Id = tech.Id
          WHERE tech.obj_technology_status_Id not in (1, 8, 9)
            AND tech.ChangeDTG <= (now() - interval 6 month);
            """, con=connection)

        # Send error message if pocs are empty
        if pocs.empty:
            error_msg = "Technology POCs could not be retrieved. Aborting..."
            error_routine(error_msg)
        else:
            write_log("Successfully Retrieved Technology POC Data")

    return pocs


def get_old_data(app_tech: str) -> pd.DataFrame:
    """
    Retrieve Application or IT Standards that have not been updated in the past 6 months
    Inputs:
        api_string (str): Path to respective GEAR API
        app_tech (str): Flag denoting 'app' or 'tech'
    Output:
        pd.DataFrame: App or technology dataframe
    """
    # Get Query from APIs folder
    if app_tech == 'app':
        with open('./api/queries/GET/get_application_full_suite.sql') as reader:
            query = reader.read() + " WHERE org.Keyname <> 'External' GROUP BY app.Id ORDER BY app.Keyname;"
    else:
        with open('./api/queries/GET/get_it-standards.sql') as reader:
            query = reader.read() + """
            WHERE obj_standard_type.Keyname LIKE 'Software'
                AND obj_technology_status.Keyname NOT LIKE 'Not yet submitted'
            GROUP BY tech.Id;"""

    data = pd.read_sql(query, con=connection)

    if data.empty:
        error_msg = f"""Something went wrong with grabbing {app_tech} data.
                        Please check the query strings or location of query files in API folder.
                        Aborting Emailing Automation."""
        error_routine(error_msg)
    else:
        data['ChangeDTG'] = pd.to_datetime(data['ChangeDTG'])

    if app_tech == 'app':
        # Filter out Retired and Nulls
        data = data[data['Status'] != 'Retired']

        cols = ['Application_Notes', 'Application_or_Website', 'BusinessPOC', 'CUI', 'Cloud', 'Description', 'DisplayName', 'FISMASystem', 'HostingProvider', 'ID',
                'Investment', 'Mobile_App_Indicator', 'Name', 'OMBUID', 'Owner', 'ParentSystem', 'ProdYear', 'Reference_Document', 'SSO', 'Status', 'TechnicalPOC', 'URL']
    else:
        # Filter only Active and not Nulls
        data = data[~data['Status'].isin(
            ['Sunsetting', 'Not yet submitted', 'Denied'])]

        # Format expiration date column
        data.loc[data['ApprovalExpirationDate'].notnull(), 'ApprovalExpirationDate'] = pd.to_datetime(
            data.loc[data['ApprovalExpirationDate'].notnull(), 'ApprovalExpirationDate']).dt.strftime("%b %d, %Y")

        cols = ['ApprovalExpirationDate', 'Available_through_Myview', 'Category', 'Comments', 'ComplianceStatus', 'DeploymentType',
                'Description', 'Gold_Image', 'Gold_Image_Comment', 'ID', 'Name', 'POC', 'ReferenceDocument', 'StandardType', 'Status', 'Vendor_Standard_Organization']

    # Only keep items that have not been updated in the last months
    now = datetime.datetime.now()
    six_months = now + dateutil.relativedelta.relativedelta(months=-6)
    data = data[data['ChangeDTG'] < six_months]
    data = data[cols]  # Filter out only needed columns

    return data.reset_index(drop=True)


def db_setup() -> sqlalchemy.engine:
    """
    Setup connection to GEAR MySQL Database
    Inputs:
        None
    Output:
        sqlalchemy.engine: SQLAlchemy Engine Connection Object
    """
    ssl_args = {
        'ssl_ca': './certs/ca.pem',
        'ssl_cert': './certs/client-cert.pem',
        'ssl_key': './certs/client-key.pem'
    }
    db_uri = f"mysql+mysqlconnector://{db_user}:{db_pass}@{db_host}/{default_schema}"

    return create_engine(db_uri, connect_args=ssl_args, echo=True)


def write_log(log_msg: str) -> None:
    """
    Write logging messages to a log file
    Inputs:
        log_msg (str): Desired log message
    Output:
        None
    """
    # Include Current Datetime of write
    current_date = datetime.datetime.now().strftime("%Y-%b-%d")
    now = datetime.datetime.now().strftime("%Y-%b-%d %H:%M:%S")
    file_name = f"{log_loc}email_automation-{current_date}.txt"

    if os.path.exists(file_name):
        append_write = 'a'  # append if file already exists
    else:
        os.makedirs(log_loc, exist_ok=True)
        append_write = 'w'  # make a new file if not

    with open(file_name, append_write) as log_file:
        log_file.write(f"{now}: {log_msg}\n")


def error_routine(msg: str) -> None:
    """
    When an error occurs, send the error email, write the error message to log, and exit program
    Inputs:
        msg (str): Error message to write and show
    """
    error_email(msg)
    write_log(msg + "\n\n")
    sys.exit(msg)


# Main Function
def main() -> None:
    # Get POCs
    app_pocs = get_pocs('app')
    tech_pocs = get_pocs('tech')

    # For non-production, pick email to replace with dev_email in order to test
    if env != 'production':
        app_replace_email = None

        # Find a name in both lists
        for name in set(app_pocs['Name']):
            if name in set(tech_pocs['Name']):
                app_replace_email = tech_replace_email = app_pocs[app_pocs['Name']
                                                                  == name].iloc[0]['Email']
                app_replace_id = tech_replace_id = app_pocs[app_pocs['Name']
                                                            == name].iloc[0]['POC_ID']
                break

        # If none found, take the first
        if app_replace_email is None:
            app_replace_email = app_pocs.loc[0, 'Email']
            app_replace_id = app_pocs.loc[0, 'POC_ID']

            tech_replace_email = tech_pocs.loc[0, 'Email']
            tech_replace_id = tech_pocs.loc[0, 'POC_ID']

    # Get data older than 6 months
    app_data = get_old_data('app')
    tech_data = get_old_data('tech')
    if app_data is not None or tech_data is not None:
        write_log("Successfully Grabbed App & Tech Data")

    # For testing purposes
    if env != 'production':
        # Replace POC email with dev email and send one email
        app_pocs = app_pocs.replace(
            to_replace=app_replace_email, value=dev_email)
        send_email_for_poc(app_pocs, app_data, 'app', app_replace_id)

        tech_pocs = tech_pocs.replace(
            to_replace=tech_replace_email, value=dev_email)
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
    engine = db_setup()

    with engine.connect() as connection:
        # write_log(f"Connection to Database Successful from {env} to {db_host}")
        rs = connection.execute("SELECT 1 as is_alive")

        # Error when connection to database fails
        if rs is None:
            error_msg = "Connection to database failed. Please check connection credentials or network connection. Aborting automated emailing"
            error_routine(error_msg)

        # Now ready for main function
        main()

    write_log("----- Finished Emailing POCs -----\n\n")