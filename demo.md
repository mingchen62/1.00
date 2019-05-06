---


---

<h2 id="demo">Demo</h2>
<pre><code>Prerequisite: To config AWS private key and certificates
</code></pre>
<p><strong>Data ingestion</strong></p>
<p>Go to terminal and invoke nodeJS program using  AWS IOT SDK<br>
% cd connect_device_package_my_first_thing<br>
% node device.js<br>
(it will pump events.json to mqtt topic: ‘myTopic’)<br>
To ingest single event, use json file, test.json</p>
<p><strong>Data persistence</strong></p>
<p>Go to AWS console, check dynamoDB, table<br>
<img src="https://s3.amazonaws.com/mchen62/smart_parking_dynamo.png" alt="aws_dynamo_db"></p>
<p><strong>Data consumption</strong></p>
<p>Go to AWS API gateway to query data.</p>
<pre><code>REST API
</code></pre>
<ul>
<li>
<p>/api/meters?limit=<em>limit</em>&amp; page=<em>page</em><br>
Get current status of all meters with pagination</p>
</li>
<li>
<p>/api/meter/<em>id</em>/status<br>
Get current status of a specific meter ID</p>
</li>
<li>
<p>/apt/meter/<em>id</em>/status?ts=<br>
Get status of a specific meter ID at a given point of time</p>
</li>
</ul>
<p>Some sample query:</p>
<p><img src="https://s3.amazonaws.com/mchen62/smart_parking_dynamo.png" alt="enter image description here"></p>
<p>Demo:<br>
meter_id: 95085_Florencio_Lights_XYZ_AB_4<br>
ts: 1519516800</p>
<blockquote>
<p>Written with <a href="https://stackedit.io/">StackEdit</a>.</p>
</blockquote>

