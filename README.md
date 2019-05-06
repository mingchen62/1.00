---


---

<h1 id="section">1.00</h1>
<p>1.00 Engineering computation</p>
<p><strong>Summary</strong></p>
<p>This project is to gather sensor information from parking meters in order to provide better parking experience to customer and reduce traffic congestion. In addition, we also like to discover any potential trends or issues related to parking conditions, thus reporting and analytics functions are needed.<br>
We’ll first present goals and requirements. Then, we’ll discuss data flow, followed by architecture consideration and tradeoff discussion.  POC is developed to illustrate end to end integration using various AWS services, including AWS IOT SDK, IOT core, IOT rules, Dynamo, Lambda and API gateway.</p>
<p><strong>Background</strong></p>
<p>It is a common occurrence for many cities where motorists find it hard to find parking even though there are many metered parking street spots in and around the downtown area. The problem is worse during the peak demand hours of weekday mornings and weekend evenings. The free parking spots are not always easy to locate. This leads to a number of motorists roaming around looking for parking which makes the problem worse by creating additional traffic congestion. This project is to aim to provide solution to tracking parking lot availability real time using IOT and notify/guide motorists to nearby available parking spots.</p>
<p><strong>Architecture</strong></p>
<p>The proposal solution is to leverage various AWS services to build a scalable and flexible architecture:</p>
<p>These loosely-coupled services offer scalability, high availability, ease of expansive and reduced maintenance.</p>
<ul>
<li>Data ingestion: AWS IOT core automatically scales to support large scale of devices and messages volume, where various AWS IOT rules enable flexible data flows in real time notification, real time update as well as report /analytics.</li>
<li>Data processing: We will use various AWS Lambda to support different data flows. Lambda functions will  automatically process data and deliver the processed data downstream. It’s completely serverless. Integrating with AWS IoT, it can act as a continuous event data processor. Lambda will perform some data processing and transformation. For parking status update, a Lambda function extracts status update and update the availability of parking spots. For real time notification, another Lambda function can check subscription and invoke AWS SNS to notify customer in real time.</li>
<li>Data store: As a fully managed service, AWS dynamo DB is used as the primary data store to support high requests rates and data ingestion. It provides flexible scaling and advanced data structures that can speed development and reduce computational complexity. With TTL enabled, historic data can then be archived to AWS S3 for report and analysis.</li>
</ul>
<p>· Data Service: REST API is implemented using API Gateway and backed by a Node.js Lambda function. It receives the request, query dynamo DB and returns the requested info back to customer. With serverless architecture, it offers flexibility, auto scaling with minimum maintenance.</p>
<p><img src="https://s3.amazonaws.com/mchen62/smart_parking_arch.png" alt="enter image description here"></p>
<p><strong>Data Model and Data flow</strong></p>
<p>The raw input data contains information about timestamp, occupancy data, street address, meter number, location etc.</p>
<p>While raw time series data is useful to capture the usage of a specific parking spot, further data processing are needed to aggregate the information on the street level, as well as provide real time status update. Some of more frequently use of data are identified as follows:</p>
<p>Queries</p>
<ol>
<li>
<p>Show all available parking spots</p>
</li>
<li>
<p>Show historic occupancy data of all parking spots</p>
</li>
<li>
<p>Show current status of a specific parking spot (meter)</p>
</li>
<li>
<p>Show current status of a specific street (identified by address)</p>
</li>
<li>
<p>Show all occupied durations for a specific meter_id.</p>
</li>
<li>
<p>Show all parking data related to specific street/address.</p>
</li>
</ol>
<p>Raw JSON from device</p>
<p>{<br>
“timestamp”: 1519516800,<br>
“isOccupied”: true,<br>
“meter”: {<br>
“number”: 4,<br>
“location”: [<br>
“-75.5712”,<br>
“-130.5355”<br>
],<br>
“address”: “95085 Florencio Lights XYZ AB”<br>
}<br>
}</p>
<p>With the help of Lambda, the nested JSON in the raw data can be flattened into a time series table into Dynamo db as defined as follows. The field ‘meter_ID’ is constructed by combining street address and meter number from raw JSON data into a unique partition key to uniquely identify a parking spot.</p>
<p>Table 1: ‘TimeSeries’ Table in Dynamo DB segmented by time</p>

<table>
<thead>
<tr>
<th>meter_Id</th>
<th>timestamp</th>
<th>isOccupied</th>
<th>address</th>
<th>location</th>
<th>meter_number</th>
</tr>
</thead>
<tbody>
<tr>
<td>string, hashkey</td>
<td>string</td>
<td>string</td>
<td>string</td>
<td>string</td>
<td>string</td>
</tr>
</tbody>
</table><p>Partition key: meter_id - computed by lambda using address and meter number</p>
<p>Sort key: timestamp</p>
<p>Local Secondary Index</p>
<p>MetersIndex (Local  Secondary  Index): meter_Id (hash key) || timestamp (range key)</p>
<p>Global Secondary Index</p>
<p>AddressIndex (Global  Secondary  Index): address (hash key) || timestamp (range key)</p>
<p>Two secondary indexes are used to support the above query on the specific meter level as well as on the street address level.</p>
<p>The time series table is used to capture and maintain the order of the events (in this case, sensor readings). The key for this data structure is meter ID, therefore all events belongs to one meter will be stored in the same partition. This sort key of timestamp will maintain the order by using the timestamp value. When used together, the timestamp set and meter ID provide the time the event occurred and the data associated with the parking meter.</p>
<p><strong>Data Segmentation</strong></p>
<p>It is a common access pattern that latest parking data is more relevant. Customer might access the latest parking data more frequently and the older items are rarely accessed. To address this access pattern, we could segment data into multiple tables. For example, we could create tables to store weekly sensor data. For the table storing data from the latest week data, where data access rate is high, we can request higher throughput. For the tables storing older data, we could use a smaller throughput and save on resources and cost. For old tables (we can archive those data to S3 and delete those tables from DynamoDB.</p>
<p>Another alternative is to segment data using other criteria, for example, based on location. For example, we could create tables to store weekly data by geo location. This could help performance and enable value -added service if other location-based query is needed on top of querying parking availability.</p>
<p>Table 2: ‘Availability’ Table in Dynamo DB</p>

<table>
<thead>
<tr>
<th>address</th>
<th>meter_number</th>
<th>isOccupied</th>
<th>address</th>
<th>location</th>
</tr>
</thead>
<tbody>
<tr>
<td>string, hashkey</td>
<td>string</td>
<td>string</td>
<td>string</td>
<td>string</td>
</tr>
</tbody>
</table><p>Partition key: address</p>
<p>Sort key: meter_number</p>
<p>Segment the data into tables based on the granularity that best fits our use cases. For example, we can segment the updates by day.</p>
<p>With help of another Lambda, a table of Availably will be populated to keep track of the occupied status of all parking spot. With address as partition key and meter number as sort key, this table can support real time query on both address level and meter level.</p>
<p>Two primary use of the data, real time query and historic query will be exposed to third party application as REST APIs. We will use AWS ECS to host node.js application to support those queries. Status and update on Two main resources type: parking meters and street address are represented via REST actions: GET, POST, DELETE and PATH. Detailed API document can be found in the appendix.</p>
<p><strong>Architecture considerations and tradeoff</strong></p>
<p>· <strong>Sensor</strong></p>
<p>Sensor is an important part in our solution. It works in a constrained environment and distributed in a wide range of area. Its reliability, ease of maintenance and battery life will directly impact the quality and cost of the whole solution and warrants close attention.</p>
<p>The following features are needed in selecting the parking sensor in order to <em>detect the vehicle occupying the parking spots.</em></p>
<p>§  Multiple technologies such as infrared and magnetic technology are used to detect vehicle parking.  Multiple sources of detection will help to reduce noises introduced by complicated operation environment. Magnetic technology is prone to be interfered by electronic magnetic environment and infrared technology can be interfered by weather and other environment factors.  Efficient algorithm on multiple sources of information can help to improve accuracy.</p>
<p>§  Efficient power management with PSM (power saving mode) is essential to preserve battery life.</p>
<p>§  Wireless for ease of installation and minimal costs by eliminating civil works.</p>
<p>§  Robust construction to resist both vandalism and accidental damage.</p>
<p>§  No dependence or impact on existing city infrastructure to ensure portability.</p>
<p>Alternative is to use a smart edge device such as deep lens with objection detection to detect vehicle parked at the spot. It will enable more use cases with a higher cost of hardware and deployment.</p>
<p>· <strong>Connectivity</strong></p>
<p>Traditional cellular options such as 4G and LTE networks consume too much power and is not a good fit for many IOT applications where only a small amount of data is transmitted infrequently. For our application, we are best suited to use low-power, wide-area network (LPWAN). Cat-M or NB IOT are some good choices to provide connectivity for our IOT devices.</p>
<p>Alternative is to have parking sensors connected to IOT gateway via local network and have IOT gateway connect to cloud using LPWAN. IOT gateway can use AWS IOT Greengrass to aggregate sensor data and only send data to the cloud where there is an update.</p>
<p>· <strong>Data Protocol</strong></p>
<p>Message Queue Telemetry Transport — MQTT and Constrained Application protocol — CoAP are two good choices of IOT data protocols. Both protocols were widely used to accommodate ultra-constrained Internet connected.</p>
<p>Depending on specific use cases, message communication patterns (Broker vs. client-server), MQTT vs. CoAP finds different fit in various use cases.</p>
<p>In our case, mostly we focus on telemetry data use case. MQTT offers a good choice of QoS (we do not want to mess up with parking lot availability), scalability, ease support of data management, support of smaller payload size, therefore we choose MQTT as data protocol in this solution.</p>
<p>Alternatives such as CoAP together with LWM2M can provide more device management and device diagnostics capability with a different architecture of client-server communication.</p>
<p><strong><em>Architecture consideration of High-Availability, Resiliency, Maintainability</em></strong></p>
<p>· <em>Data ingestion:</em></p>
<p><em>Data ingestion is the entry point into cloud of this architecture, where message volume is usually the largest without filtering or processing and more often than not, one of the weakest links in IOT architecture. We utilize AWS IOT core to</em> ingest data from IOT devices. AWS IOT core is a managed platform with built in HA and maintainability. AWS provides redundancy across AZ and will auto scale based on work load with no pre-provisioning. With the help of AWS IOT core, we are better equipped to handle the flood of data ingestion.</p>
<p>· Data processing:</p>
<p>Thanks for event driven architecture and server less computation, we achieved <em>High-Availability, Resiliency, Maintainability in data processing.</em></p>
<p>AWS Lambda executes application code only when needed and scales automatically, from a few requests per day to thousands per second, without provisioning or managing servers</p>
<p>AWS Lambda runs on a high-availability compute infrastructure and performs all of the administration of the compute resources, including server and operating system maintenance, capacity provisioning and automatic scaling, code monitoring and logging.</p>
<p>§ Data storage:</p>
<p>With AWS dynamo DB, again we are relieved with hardware provisioning, setup and configuration, replication, software patching, or cluster scaling.</p>
<p>Amazon DynamoDB is a fully managed NoSQL database service that provides fast and predictable performance with seamless scalability. DynamoDB lets us offload the administrative burdens of operating and scaling a distributed database, with built-in HA and resiliency.</p>
<p><strong>Security Consideration</strong></p>
<p>· Shared security model:</p>
<p>As it is well known, Security and Compliance is a shared responsibility between AWS and the customer. AWS operates, manages and controls the AWS infrastructure and services, and customer will be responsible for application software as well as the AWS configuration. With cloud security falls into AWS ‘s responsibility, customer shall still keep sight of application and operation security.</p>
<p>· Data ingestion Security</p>
<p>AWS IoT message broker and Device Shadow service encrypt all communication with TLS 1.2. When using AWS IoT authentication, the message broker authenticates and authorizes all actions in your account. Therefore, the communication with device and device are authenticating via two-way mutual x.509 verification.  Device data is securely ingested using certificates, and adhering to the access permissions we place on devices using policies.</p>
<p>· Data security at REST and in transit</p>

