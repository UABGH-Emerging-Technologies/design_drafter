export const DIAGRAM_TYPES = [
	'Use Case',
	'Class',
	'Object',
	'Package',
	'Profile',
	'Composite Structure',
	'Activity',
	'Component',
	'Deployment',
	'State Machine',
	'Timing',
	'Communication',
	'Interaction Overview',
	'Sequence',
]

export const DEFAULT_DIAGRAM_TYPE = DIAGRAM_TYPES[0]

export const DIAGRAM_TEMPLATES: Record<string, string> = {
	'Use Case': `@startuml
left to right direction
actor User
actor System
User --> (Submit Request)
(Submit Request) --> System
System --> (Process Request)
System --> (Send Response)
@enduml`,
	Class: `@startuml
class User {
-String username
-String email
+login()
+logout()
}

class Post {
-String title
-String content
-Date createdAt
+publish()
}

User "1" -- "many" Post : creates
@enduml`,
	Object: `@startuml
object "Order #42" as Order
object "Customer" as Customer
object "Payment" as Payment

Customer : name = "Alice"
Order : status = "Pending"
Payment : method = "Credit Card"

Customer --> Order : places
Order --> Payment : uses
@enduml`,
	Package: `@startuml
package "UI Layer" #LightBlue {
  [Web Client]
  [Mobile Client]
}

package "Application Layer" #LightGreen {
  [REST API]
  [Background Jobs]
}

package "Data Layer" #LightYellow {
  database "Main DB"
}

[Web Client] --> [REST API]
[Mobile Client] --> [REST API]
[REST API] --> "Main DB"
@enduml`,
	Profile: `@startuml
profile "DeploymentProfile" {
  stereotype <<device>>
  stereotype <<executionEnvironment>>
}

package "Nodes" {
  node "Edge Device" <<device>>
  node "Kubernetes Cluster" <<executionEnvironment>>
}
@enduml`,
	'Composite Structure': `@startuml
class OrderService {
  -orderRepository
  -paymentGateway
}

OrderService o--> "1" OrderRepository
OrderService o--> "1" PaymentGateway
OrderRepository --> Database : persists
PaymentGateway --> ExternalAPI : charges
@enduml`,
	Activity: `@startuml
start
:User opens application;
if (Is logged in?) then (yes)
:Show dashboard;
else (no)
:Show login form;
:User enters credentials;
if (Credentials valid?) then (yes)
  :Authenticate user;
  :Show dashboard;
else (no)
  :Show error message;
  stop
endif
endif
:User interacts with app;
stop
@enduml`,
	Component: `@startuml
[Web Client] --> [REST API]
[REST API] --> [Service Layer]
[Service Layer] --> [Database]
[Service Layer] --> [Queue]
@enduml`,
	Deployment: `@startuml
node "Client" {
  component "Web App"
}

node "Server" {
  component "API"
  database "DB"
}

"Web App" --> "API"
"API" --> "DB"
@enduml`,
	'State Machine': `@startuml
[*] --> Idle
Idle --> Processing : start
Processing --> Idle : success
Processing --> Error : failure
Error --> Idle : reset
@enduml`,
	Timing: `@startuml
robust "Sensor" as Sensor
concise "Controller" as Controller

Sensor is Idle
Controller is Idle
@0
Sensor -> Controller: heartbeat
@100
Controller -> Sensor: ack
@enduml`,
	Communication: `@startuml
actor User
object WebApp
object ApiServer
object Database

User -> WebApp : 1: Login()
WebApp -> ApiServer : 2: authenticate()
ApiServer -> Database : 3: fetchUser()
Database --> ApiServer : 4: userData
ApiServer --> WebApp : 5: authResult
WebApp --> User : 6: showResult()
@enduml`,
	'Interaction Overview': `@startuml
start
partition "Login Flow" {
  :User submits credentials;
  :Authenticate user;
}
partition "Post Login" {
  :Load dashboard widgets;
  :Notify user of new tasks;
}
stop
@enduml`,
	Sequence: `@startuml
actor User
participant "Web App" as A
participant "API Server" as B
database "Database" as C

User -> A: Login Request
A -> B: Authenticate
B -> C: Query User
C --> B: Return User Data
B --> A: Authentication Response
A --> User: Login Result
@enduml`,
}
