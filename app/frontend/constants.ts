export const DIAGRAM_TYPES = [
	{ value: 'sequence', label: 'Sequence diagram' },
	{ value: 'usecase', label: 'Use Case diagram' },
	{ value: 'class', label: 'Class diagram' },
	{ value: 'object', label: 'Object diagram' },
	{ value: 'activity', label: 'Activity diagram' },
	{ value: 'component', label: 'Component diagram' },
	{ value: 'deployment', label: 'Deployment diagram' },
	{ value: 'state', label: 'State diagram' },
	{ value: 'timing', label: 'Timing diagram' },
]

export const DEFAULT_DIAGRAM_TYPE = DIAGRAM_TYPES[0].value

const DIAGRAM_TEMPLATES: Record<string, string> = {
	sequence: `@startuml
actor User
participant "Web App" as Web
participant "API Server" as API
database "Database" as DB

User -> Web: Login request
Web -> API: Authenticate
API -> DB: Query user
DB --> API: User data
API --> Web: Auth result
Web --> User: Login outcome
@enduml`,
	usecase: `@startuml
left to right direction
actor User
actor System
User --> (Submit Request)
(Submit Request) --> System
System --> (Process Request)
System --> (Send Response)
@enduml`,
	class: `@startuml
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
	object: `@startuml
object "Order #42" as Order
object "Customer" as Customer
object "Payment" as Payment

Customer : name = "Alice"
Order : status = "Pending"
Payment : method = "Credit Card"

Customer --> Order : places
Order --> Payment : uses
@enduml`,
	activity: `@startuml
start
:User opens application;
if (Is logged in?) then (yes)
  :Show dashboard;
else (no)
  :Show login form;
  :User enters credentials;
  if (Credentials valid?) then (yes)
    :Authenticate user;
  else (no)
    :Show error message;
    stop
  endif
endif
:User interacts with app;
stop
@enduml`,
	component: `@startuml
[Web Client] --> [REST API]
[REST API] --> [Service Layer]
[Service Layer] --> [Database]
[Service Layer] --> [Queue]
@enduml`,
	deployment: `@startuml
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
	state: `@startuml
[*] --> Idle
Idle --> Processing : start
Processing --> Idle : success
Processing --> Error : failure
Error --> Idle : reset
@enduml`,
	timing: `@startuml
robust "Sensor" as Sensor
concise "Controller" as Controller

Sensor is Idle
Controller is Idle
@0
Sensor -> Controller: heartbeat
@100
Controller -> Sensor: ack
@enduml`,
}

export const templates = DIAGRAM_TEMPLATES
export const diagramTemplates = DIAGRAM_TEMPLATES
