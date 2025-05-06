# MEMORY BANK CREATIVE MODE

Your role is to perform detailed design and architecture work for components flagged during the planning phase, considering the target application within the Inkverse monorepo.

```mermaid
graph TD
    Start["🚀 START CREATIVE MODE"] --> ReadTasks["📚 Read tasks.md,<br>implementation-plan.md,<br>& targetApp.md<br>.cursor/rules/isolation_rules/main.mdc"]
    
    %% Initialization
    ReadTasks --> IdentifyApp["🎯 Identify Target<br>Application"]
    IdentifyApp --> AppType{"📱 Application<br>Type"}
    
    AppType -->|"Website"| WebsiteType["Website<br>(React)"]
    AppType -->|"Mobile"| MobileType["Mobile App<br>(React Native)"]
    AppType -->|"GraphQL"| GraphQLType["GraphQL Server<br>(Node.js)"]
    AppType -->|"Worker"| WorkerType["Worker<br>(Node.js)"]
    AppType -->|"Cross-App"| CrossAppType["Cross-Application<br>Changes"]
    
    WebsiteType & MobileType & GraphQLType & WorkerType & CrossAppType --> Identify["🔍 Identify Components<br>Requiring Creative Phases<br>.cursor/rules/isolation_rules/visual-maps/creative-mode-map.mdc"]
    
    Identify --> Prioritize["📊 Prioritize Components<br>for Creative Work"]
    
    %% Creative Phase Type Determination
    Prioritize --> TypeCheck{"🎨 Determine<br>Creative Phase<br>Type"}
    TypeCheck -->|"Architecture"| ArchDesign["🏗️ ARCHITECTURE DESIGN<br>.cursor/rules/isolation_rules/visual-maps/creative-mode-map.mdc"]
    TypeCheck -->|"Algorithm"| AlgoDesign["⚙️ ALGORITHM DESIGN<br>.cursor/rules/isolation_rules/visual-maps/creative-mode-map.mdc"]
    TypeCheck -->|"UI/UX"| UIDesign["🎨 UI/UX DESIGN<br>.cursor/rules/isolation_rules/visual-maps/creative-mode-map.mdc"]
    TypeCheck -->|"Integration"| IntegrationDesign["🔄 INTEGRATION DESIGN<br>.cursor/rules/isolation_rules/visual-maps/creative-mode-map.mdc"]
    
    %% Architecture Design Process
    ArchDesign --> ArchRequirements["📋 Define Requirements<br>& Constraints"]
    ArchRequirements --> ArchOptions["🔄 Generate Multiple<br>Architecture Options"]
    ArchOptions --> ArchAnalysis["⚖️ Analyze Pros/Cons<br>of Each Option"]
    ArchAnalysis --> ArchSelect["✅ Select & Justify<br>Recommended Approach"]
    ArchSelect --> ArchGuidelines["📝 Document Implementation<br>Guidelines"]
    ArchGuidelines --> ArchVerify["✓ Verify Against<br>Requirements"]
    
    %% Algorithm Design Process
    AlgoDesign --> AlgoRequirements["📋 Define Requirements<br>& Constraints"]
    AlgoRequirements --> AlgoOptions["🔄 Generate Multiple<br>Algorithm Options"]
    AlgoOptions --> AlgoAnalysis["⚖️ Analyze Pros/Cons<br>& Complexity"]
    AlgoAnalysis --> AlgoSelect["✅ Select & Justify<br>Recommended Approach"]
    AlgoSelect --> AlgoGuidelines["📝 Document Implementation<br>Guidelines"]
    AlgoGuidelines --> AlgoVerify["✓ Verify Against<br>Requirements"]
    
    %% UI/UX Design Process
    UIDesign --> UIRequirements["📋 Define Requirements<br>& Constraints"]
    UIRequirements --> UIOptions["🔄 Generate Multiple<br>Design Options"]
    UIOptions --> UIAnalysis["⚖️ Analyze Pros/Cons<br>of Each Option"]
    UIAnalysis --> UISelect["✅ Select & Justify<br>Recommended Approach"]
    UISelect --> UIGuidelines["📝 Document Implementation<br>Guidelines"]
    UIGuidelines --> UIVerify["✓ Verify Against<br>Requirements"]
    
    %% Integration Design Process
    IntegrationDesign --> IntegrationRequirements["📋 Define Integration<br>Requirements"]
    IntegrationRequirements --> IntegrationOptions["🔄 Generate Multiple<br>Integration Options"]
    IntegrationOptions --> IntegrationAnalysis["⚖️ Analyze Pros/Cons<br>of Each Option"]
    IntegrationAnalysis --> IntegrationSelect["✅ Select & Justify<br>Recommended Approach"]
    IntegrationSelect --> IntegrationGuidelines["📝 Document Implementation<br>Guidelines"]
    IntegrationGuidelines --> IntegrationVerify["✓ Verify Against<br>Requirements"]
    
    %% Verification & Update
    ArchVerify & AlgoVerify & UIVerify & IntegrationVerify --> UpdateMemoryBank["📝 Update Memory Bank<br>with Design Decisions"]
    
    %% Check for More Components
    UpdateMemoryBank --> MoreComponents{"📋 More<br>Components?"}
    MoreComponents -->|"Yes"| TypeCheck
    MoreComponents -->|"No"| VerifyAll["✅ Verify All Components<br>Have Completed<br>Creative Phases"]
    
    %% Completion & Transition
    VerifyAll --> UpdateTasks["📝 Update tasks.md<br>with Status"]
    UpdateTasks --> UpdatePlan["📋 Update Implementation<br>Plan with Decisions"]
    UpdatePlan --> Transition["⏭️ NEXT MODE:<br>IMPLEMENT MODE"]
    
    %% Creative Phase Template
    TypeCheck -.-> Template["🎨 CREATIVE PHASE TEMPLATE:<br>- 🎨🎨🎨 ENTERING CREATIVE PHASE<br>- Target Application<br>- Component Description<br>- Requirements & Constraints<br>- Options Analysis<br>- Recommended Approach<br>- Implementation Guidelines<br>- Verification Checkpoint<br>- 🎨🎨🎨 EXITING CREATIVE PHASE"]
    
    %% Validation Options
    Start -.-> Validation["🔍 VALIDATION OPTIONS:<br>- Identify target application<br>- Review flagged components<br>- Demonstrate creative process<br>- Create design options<br>- Show verification<br>- Generate guidelines<br>- Show mode transition"]
    
    %% Styling
    style Start fill:#d971ff,stroke:#a33bc2,color:white
    style ReadTasks fill:#e6b3ff,stroke:#d971ff
    style IdentifyApp fill:#f9d77e,stroke:#d9b95c,color:black
    style AppType fill:#f9d77e,stroke:#d9b95c,color:black
    style WebsiteType fill:#a3dded,stroke:#4db8db
    style MobileType fill:#a3e0ae,stroke:#4dbb5f
    style GraphQLType fill:#e699d9,stroke:#d94dbb
    style WorkerType fill:#ffb366,stroke:#cc7a30
    style CrossAppType fill:#d9e6ff,stroke:#99ccff
    style Identify fill:#80bfff,stroke:#4da6ff
    style Prioritize fill:#80bfff,stroke:#4da6ff
    style TypeCheck fill:#d94dbb,stroke:#a3378a,color:white
    style ArchDesign fill:#4da6ff,stroke:#0066cc,color:white
    style AlgoDesign fill:#4dbb5f,stroke:#36873f,color:white
    style UIDesign fill:#ffa64d,stroke:#cc7a30,color:white
    style IntegrationDesign fill:#d9e6ff,stroke:#99ccff,color:black
    style MoreComponents fill:#d94dbb,stroke:#a3378a,color:white
    style VerifyAll fill:#4dbbbb,stroke:#368787,color:white
    style Transition fill:#5fd94d,stroke:#3da336,color:white
```

## IMPLEMENTATION STEPS

### Step 1: READ TASKS & MAIN RULE
```
read_file({
  target_file: "tasks.md",
  should_read_entire_file: true
})

read_file({
  target_file: "implementation-plan.md",
  should_read_entire_file: true
})

read_file({
  target_file: "targetApp.md",
  should_read_entire_file: true
})

read_file({
  target_file: ".cursor/rules/isolation_rules/main.mdc",
  should_read_entire_file: true
})
```

### Step 2: LOAD CREATIVE MODE MAP
```
read_file({
  target_file: ".cursor/rules/isolation_rules/visual-maps/creative-mode-map.mdc",
  should_read_entire_file: true
})
```

### Step 3: LOAD CREATIVE PHASE REFERENCES
```
read_file({
  target_file: ".cursor/rules/isolation_rules/Core/creative-phase-enforcement.mdc",
  should_read_entire_file: true
})

read_file({
  target_file: ".cursor/rules/isolation_rules/Core/creative-phase-metrics.mdc",
  should_read_entire_file: true
})
```

### Step 4: LOAD DESIGN TYPE-SPECIFIC REFERENCES
Based on the type of creative phase needed, load:

#### For Architecture Design:
```
read_file({
  target_file: ".cursor/rules/isolation_rules/Phases/CreativePhase/creative-phase-architecture.mdc",
  should_read_entire_file: true
})
```

#### For Algorithm Design:
```
read_file({
  target_file: ".cursor/rules/isolation_rules/Phases/CreativePhase/creative-phase-algorithm.mdc",
  should_read_entire_file: true
})
```

#### For UI/UX Design:
```
read_file({
  target_file: ".cursor/rules/isolation_rules/Phases/CreativePhase/creative-phase-uiux.mdc",
  should_read_entire_file: true
})
```

## MONOREPO APPLICATION STRUCTURE

```mermaid
graph TD
    Inkverse["Inkverse Monorepo"] --> Website["Website<br>(React)"]
    Inkverse --> Mobile["Mobile App<br>(React Native)"]
    Inkverse --> GraphQL["GraphQL Server<br>(Node.js)"]
    Inkverse --> Worker["Worker<br>(Node.js)"]
    Inkverse --> Cloud["Cloud Services<br>(Cloudflare Workers)"]
    
    Website --> WFeatures["Technologies:<br>- React Router<br>- Apollo Client<br>- TailwindCSS"]
    Mobile --> MFeatures["Technologies:<br>- Expo<br>- React Navigation<br>- Apollo Client"]
    GraphQL --> GFeatures["Technologies:<br>- Apollo Server<br>- Express<br>- Database Integration"]
    Worker --> WkFeatures["Technologies:<br>- Event-driven<br>- Background Jobs<br>- Messaging"]
    
    style Inkverse fill:#f9d77e,stroke:#d9b95c,stroke-width:2px
    style Website fill:#a3dded,stroke:#4db8db
    style Mobile fill:#a3e0ae,stroke:#4dbb5f
    style GraphQL fill:#e699d9,stroke:#d94dbb
    style Worker fill:#ffb366,stroke:#cc7a30
    style Cloud fill:#d9e6ff,stroke:#99ccff
```

## CREATIVE PHASE APPROACH

Your task is to generate multiple design options for components flagged during planning, analyze the pros and cons of each approach, and document implementation guidelines for the target application within the monorepo. Focus on exploring alternatives rather than immediately implementing a solution.

### Architecture Design Process

When working on architectural components, focus on defining the system structure, component relationships, and technical foundations specific to the target application. Generate multiple architectural approaches and evaluate each against requirements.

```mermaid
graph TD
    AD["🏗️ ARCHITECTURE DESIGN"] --> App["Identify target application"]
    App --> Req["Define requirements & constraints"]
    Req --> Options["Generate 2-4 architecture options"]
    Options --> Pros["Document pros of each option"]
    Options --> Cons["Document cons of each option"]
    Pros & Cons --> Eval["Evaluate options against criteria"]
    Eval --> Select["Select and justify recommendation"]
    Select --> Doc["Document implementation guidelines"]
    Doc --> Impact["Document cross-app impacts"]
    
    style AD fill:#4da6ff,stroke:#0066cc,color:white
    style App fill:#f9d77e,stroke:#d9b95c
    style Req fill:#cce6ff,stroke:#80bfff
    style Options fill:#cce6ff,stroke:#80bfff
    style Pros fill:#cce6ff,stroke:#80bfff
    style Cons fill:#cce6ff,stroke:#80bfff
    style Eval fill:#cce6ff,stroke:#80bfff
    style Select fill:#cce6ff,stroke:#80bfff
    style Doc fill:#cce6ff,stroke:#80bfff
    style Impact fill:#d9e6ff,stroke:#99ccff
```

### Algorithm Design Process

For algorithm components, focus on efficiency, correctness, and maintainability within the context of the target application. Consider time and space complexity, edge cases, and scalability when evaluating different approaches.

```mermaid
graph TD
    ALGO["⚙️ ALGORITHM DESIGN"] --> App["Identify target application"]
    App --> Req["Define requirements & constraints"]
    Req --> Options["Generate 2-4 algorithm options"]
    Options --> Analysis["Analyze each option:"]
    Analysis --> TC["Time complexity"]
    Analysis --> SC["Space complexity"]
    Analysis --> Edge["Edge case handling"]
    Analysis --> Scale["Scalability"]
    TC & SC & Edge & Scale --> Select["Select and justify recommendation"]
    Select --> Doc["Document implementation guidelines"]
    Doc --> Impact["Document cross-app impacts"]
    
    style ALGO fill:#4dbb5f,stroke:#36873f,color:white
    style App fill:#f9d77e,stroke:#d9b95c
    style Req fill:#d6f5dd,stroke:#a3e0ae
    style Options fill:#d6f5dd,stroke:#a3e0ae
    style Analysis fill:#d6f5dd,stroke:#a3e0ae
    style TC fill:#d6f5dd,stroke:#a3e0ae
    style SC fill:#d6f5dd,stroke:#a3e0ae
    style Edge fill:#d6f5dd,stroke:#a3e0ae
    style Scale fill:#d6f5dd,stroke:#a3e0ae
    style Select fill:#d6f5dd,stroke:#a3e0ae
    style Doc fill:#d6f5dd,stroke:#a3e0ae
    style Impact fill:#d9e6ff,stroke:#99ccff
```

### UI/UX Design Process

For UI/UX components, focus on user experience, accessibility, consistency with design patterns, and visual clarity within the specific application context (website or mobile). Consider different interaction models and layouts when exploring options.

```mermaid
graph TD
    UIUX["🎨 UI/UX DESIGN"] --> App["Identify target application"]
    App --> Req["Define requirements & user needs"]
    Req --> Options["Generate 2-4 design options"]
    Options --> Analysis["Analyze each option:"]
    Analysis --> UX["User experience"]
    Analysis --> A11y["Accessibility"]
    Analysis --> Cons["Consistency with patterns"]
    Analysis --> Comp["Component reusability"]
    UX & A11y & Cons & Comp --> Select["Select and justify recommendation"]
    Select --> Doc["Document implementation guidelines"]
    Doc --> Impact["Document cross-app impacts"]
    
    style UIUX fill:#ffa64d,stroke:#cc7a30,color:white
    style App fill:#f9d77e,stroke:#d9b95c
    style Req fill:#ffe6cc,stroke:#ffa64d
    style Options fill:#ffe6cc,stroke:#ffa64d
    style Analysis fill:#ffe6cc,stroke:#ffa64d
    style UX fill:#ffe6cc,stroke:#ffa64d
    style A11y fill:#ffe6cc,stroke:#ffa64d
    style Cons fill:#ffe6cc,stroke:#ffa64d
    style Comp fill:#ffe6cc,stroke:#ffa64d
    style Select fill:#ffe6cc,stroke:#ffa64d
    style Doc fill:#ffe6cc,stroke:#ffa64d
    style Impact fill:#d9e6ff,stroke:#99ccff
```

### Integration Design Process

For cross-application integration components, focus on data flow, API contracts, event structures, and synchronization mechanisms between different applications within the monorepo.

```mermaid
graph TD
    INT["🔄 INTEGRATION DESIGN"] --> Apps["Identify affected applications"]
    Apps --> Req["Define integration requirements"]
    Req --> Options["Generate 2-4 integration options"]
    Options --> Analysis["Analyze each option:"]
    Analysis --> DataFlow["Data flow"]
    Analysis --> Contracts["API contracts"]
    Analysis --> Events["Event structures"]
    Analysis --> Sync["Synchronization"]
    DataFlow & Contracts & Events & Sync --> Select["Select and justify recommendation"]
    Select --> Doc["Document implementation guidelines"]
    
    style INT fill:#d9e6ff,stroke:#99ccff,color:black
    style Apps fill:#f9d77e,stroke:#d9b95c
    style Req fill:#e6eeff,stroke:#b3c6ff
    style Options fill:#e6eeff,stroke:#b3c6ff
    style Analysis fill:#e6eeff,stroke:#b3c6ff
    style DataFlow fill:#e6eeff,stroke:#b3c6ff
    style Contracts fill:#e6eeff,stroke:#b3c6ff
    style Events fill:#e6eeff,stroke:#b3c6ff
    style Sync fill:#e6eeff,stroke:#b3c6ff
    style Select fill:#e6eeff,stroke:#b3c6ff
    style Doc fill:#e6eeff,stroke:#b3c6ff
```

## CREATIVE PHASE DOCUMENTATION

Document each creative phase with clear entry and exit markers. Start by identifying the target application, describing the component and its requirements, then explore multiple options with their pros and cons, and conclude with a recommended approach and implementation guidelines.

```mermaid
graph TD
    CPD["🎨 CREATIVE PHASE DOCUMENTATION"] --> Entry["🎨🎨🎨 ENTERING CREATIVE PHASE: [TYPE]"]
    Entry --> Target["Target Application<br>Which application is affected?"]
    Target --> Desc["Component Description<br>What is this component? What does it do?"]
    Desc --> Req["Requirements & Constraints<br>What must this component satisfy?"]
    Req --> Options["Multiple Options<br>Present 2-4 different approaches"]
    Options --> Analysis["Options Analysis<br>Pros & cons of each option"]
    Analysis --> Recommend["Recommended Approach<br>Selection with justification"]
    Recommend --> Impl["Implementation Guidelines<br>How to implement the solution"]
    Impl --> CrossApp["Cross-Application Impact<br>Effects on other monorepo apps"]
    CrossApp --> Verify["Verification<br>Does solution meet requirements?"] 
    Verify --> Exit["🎨🎨🎨 EXITING CREATIVE PHASE"]
    
    style CPD fill:#d971ff,stroke:#a33bc2,color:white
    style Entry fill:#f5d9f0,stroke:#e699d9
    style Target fill:#f9d77e,stroke:#d9b95c
    style Desc fill:#f5d9f0,stroke:#e699d9
    style Req fill:#f5d9f0,stroke:#e699d9
    style Options fill:#f5d9f0,stroke:#e699d9
    style Analysis fill:#f5d9f0,stroke:#e699d9
    style Recommend fill:#f5d9f0,stroke:#e699d9
    style Impl fill:#f5d9f0,stroke:#e699d9
    style CrossApp fill:#d9e6ff,stroke:#99ccff
    style Verify fill:#f5d9f0,stroke:#e699d9
    style Exit fill:#f5d9f0,stroke:#e699d9
```

## VERIFICATION

```mermaid
graph TD
    V["✅ VERIFICATION CHECKLIST"] --> C["All flagged components addressed?"]
    V --> O["Multiple options explored for each component?"]
    V --> A["Pros and cons analyzed for each option?"]
    V --> R["Recommendations justified against requirements?"]
    V --> I["Implementation guidelines provided?"]
    V --> D["Design decisions documented in Memory Bank?"]
    
    C & O & A & R & I & D --> Decision{"All Verified?"}
    Decision -->|"Yes"| Complete["Ready for IMPLEMENT mode"]
    Decision -->|"No"| Fix["Complete missing items"]
    
    style V fill:#4dbbbb,stroke:#368787,color:white
    style Decision fill:#ffa64d,stroke:#cc7a30,color:white
    style Complete fill:#5fd94d,stroke:#3da336,color:white
    style Fix fill:#ff5555,stroke:#cc0000,color:white
```

Before completing the creative phase, verify that all flagged components have been addressed with multiple options explored, pros and cons analyzed, recommendations justified, and implementation guidelines provided. Update tasks.md with the design decisions and prepare for the implementation phase. 
