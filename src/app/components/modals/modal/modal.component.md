<div className="guide_container">
#**Usage Guide**
<br>

# Modal Component
<p>This component renders a modal component based on USWDS with DX custom styles [https://designsystem.digital.gov/components/modal/](https://designsystem.digital.gov/components/modal/).</p>
<p><strong>A modal window disables page content and focuses the user’s attention on a single task or message.  It prevents interaction with page content until the user completes an action or dismisses the modal.
</strong></p>
<ul>
<li>Should have a simple headline to explain its purpose.</li>
<li>Use enough descriptive text to be clear what the user needs to do and why.</li>
<li>Use clear header and button text.</li>
<li>Avoid long content that requires scrolling.</li>
</ul>

<p><strong>Types of Modals available: </strong></p>
<ul>
<li>Default Normal</li>
<li>Default Large</li>
<li>Default with forced action</li>
<li>Default with checkbox</li>
</ul>

<p><strong>When to use:</strong></p>
<ul>
<li>Users should trigger modals. Modals should appear as a result of an action made by the user or (less commonly) inactivity</li>
<li>Choose the right size that fits your content. Default for one to two sentences and Default Large for a few paragraphs of content.</li>
</ul>

<p><strong>When to consider something else:</strong></p>
<ul>
<li>For errors, success, or warning messages.  Use the alert component at the top of the page, or provide field level messages above the field that has an error.</li>
<li>Avoid using modals to display complex forms or large amounts of information.</li>
</ul>

<p><strong>Example use in buy.gsa.gov:</strong></p>
<div>
<i>Try to bookmark a document when not logged in - should see the modal to request login or create an account.</i>
<p> https://buy.gsa.gov/find-samples-templates-tips?sort_by=title&page=1&range=25</p>
</div>
<div>
<i>Click on “How FEMA Improved its Baseline”</i>
<p>https://buy.gsa.gov/spba/steps?step=identify-objectives&tileId=1701 </p>
</div>

<hr>

<p>Modal openers can be coded either as ```<button>``` or ```<a>```. </p>

<p>To open the modal, you must include these two attributes: *aria-controls* and *data-open-modal*, where the value of aria-controls is the modalID property set in the data object.</p>
</div>
