# Feature Specification: Milpa - AI Discovery Platform

**Feature Branch**: `001-ai-discovery-platform`
**Created**: 2026-02-15
**Status**: Draft
**Input**: User description: "Webapp full-stack Milpa - plataforma de entrevistas IA para discovery organizacional y análisis cualitativo, similar a Cardus.AI"

## Assumptions

- **Authentication**: Public self-registration via Email/Password or Google OAuth for Admin/Consultant; anonymous token-based links for Employee interviewees; email-based read-only for Viewers.
- **Roles**: User permissions (Admin, Viewer) are scoped per project. A user can be an Admin on one project and a Viewer on another.
- **Data Retention**: Interview data retained for the lifetime of the project unless the Admin explicitly deletes it.
- **Anonymization**: Automatic name/entity redaction applied to narratives post-extraction. Original transcripts stored separately with restricted access.
- **Language**: MVP supports Spanish (primary) and English. All AI-generated content respects the project's configured language.
- **Concurrency**: The system supports up to 50 simultaneous RTI sessions per project.
- **Interview Duration**: Typical RTI session lasts 15-45 minutes, producing 10-30 narrative fragments.
- **Sentiment Scale**: -2 (very negative) to +2 (very positive), with 0 as neutral.
- **Abstraction Scale**: 1 (concrete story) to 4 (high-level opinion/generalization). The RTI actively steers toward 1-2.
- **Clustering Parameters**: Default values (neighbors=15, min_dist=0.1, min_cluster_size=5, threshold=0.2) are sensible starting points; users can adjust via sliders.

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Admin Creates a Discovery Project (Priority: P1)

A consultant (Admin) signs in and creates a new organizational discovery project (e.g., "Clima Enlite Q1 2026"). They configure the project name, description, interview prompt guidelines, and define demographic categories (role, department, seniority). They then invite employees by entering email addresses individually or uploading a CSV file. Each invited employee receives a unique anonymous interview link.

**Why this priority**: Without a project and invitations, no interviews can happen. This is the foundational entry point for the entire platform.

**Independent Test**: Can be fully tested by creating a project, configuring categories, and generating invite links. Delivers value by producing shareable RTI links ready for distribution.

**Acceptance Scenarios**:

1. **Given** an authenticated Admin, **When** they fill in the project creation form with name, description, and at least one category, **Then** the project is created and visible in the Admin's project list.
2. **Given** an existing project, **When** the Admin uploads a CSV with 50 email addresses, **Then** 50 unique anonymous interview links are generated and email invitations are sent.
3. **Given** an existing project, **When** the Admin adds a single employee email, **Then** one anonymous interview link is generated and an invitation email is sent.
4. **Given** a project with invitations, **When** the Admin views the project dashboard, **Then** they see the count of invited, completed, and pending interviews.

---

### User Story 2 - Employee Completes an AI-Guided Interview (Priority: P1)

An employee receives an anonymous interview link via email. They click the link and enter a real-time conversational interview with an AI interviewer. The AI welcomes them, explains anonymity, asks for their role and tenure, then guides them through structured themes (organizational culture, facilitators/barriers, cross-area collaboration, decision-making, change). The AI actively pursues concrete stories over opinions, using follow-ups like "Can you give me a specific example?" The employee can respond via text or voice. The session is transcribed in real time.

**Why this priority**: The RTI is the core data collection mechanism. Without interviews, there are no narratives to analyze. Co-P1 with project creation.

**Independent Test**: Can be tested by opening an interview link and completing a full conversational session. Delivers value by producing a complete interview transcript.

**Acceptance Scenarios**:

1. **Given** a valid anonymous interview link, **When** the employee opens it, **Then** they see a welcome screen explaining anonymity and can begin the interview without creating an account.
2. **Given** an active interview session, **When** the employee types a response, **Then** the AI responds within 5 seconds with a contextually relevant follow-up question.
3. **Given** an active interview session, **When** the employee uses voice input, **Then** their speech is transcribed in real time and the AI responds to the transcribed text.
4. **Given** the employee gives a vague or opinion-based answer (e.g., "the culture is bad"), **When** the AI processes the response, **Then** it asks for a concrete example or story (e.g., "Can you tell me about a specific moment when you experienced that?").
5. **Given** the employee has answered questions across all themes, **When** 15+ minutes have elapsed or all themes are covered, **Then** the AI gracefully closes the interview with a thank-you message.
6. **Given** a completed interview, **When** the employee closes the browser, **Then** the full transcript is persisted and linked to the project.

---

### User Story 3 - Narrative Extraction from Interviews (Priority: P2)

After interviews are completed, the Admin triggers narrative extraction on one or more interviews. The system uses AI to break each transcript into discrete narrative fragments (10-30 per interview), each representing a story with a beginning, tension/conflict, and resolution. Each narrative is scored for sentiment (-2 to +2) and abstraction level (1-4). Narratives are automatically anonymized by redacting personal names and identifying information.

**Why this priority**: Narratives are the atomic unit of analysis. Clustering and dashboards depend on extracted narratives. Follows naturally after interviews.

**Independent Test**: Can be tested by selecting a completed interview and triggering extraction. Delivers value by producing a list of scored, anonymized narrative fragments.

**Acceptance Scenarios**:

1. **Given** a completed interview transcript, **When** the Admin triggers narrative extraction, **Then** the system produces between 10-30 narrative fragments within 60 seconds.
2. **Given** extracted narratives, **When** the Admin views the narratives list, **Then** each narrative displays its text, sentiment score, abstraction level, and source interview reference.
3. **Given** a narrative containing a person's name (e.g., "Juan told me to..."), **When** extraction completes, **Then** the name is replaced with a generic placeholder (e.g., "[Person A]").
4. **Given** a batch of 10 interviews, **When** the Admin triggers batch extraction, **Then** all interviews are processed and progress is visible in the UI.
5. **Given** extracted narratives, **When** the Admin edits a narrative's text or tags, **Then** the changes are saved and reflected immediately.

---

### User Story 4 - Semantic Clustering of Narratives (Priority: P2)

The Admin navigates to the clustering view and sees all extracted narratives plotted on a 2D semantic map. Narratives are positioned based on semantic similarity. The Admin adjusts clustering parameters (neighbor count, minimum distance, minimum cluster size, similarity threshold) via sliders and triggers clustering. The system groups narratives into clusters and generates AI-powered cluster names and summaries (e.g., "Tension: Lack of cross-departmental communication"). The Admin can view cluster details, popularity metrics, and similarity scores.

**Why this priority**: Clustering transforms raw narratives into actionable insights -- the primary deliverable for consultants. Depends on extracted narratives (P2).

**Independent Test**: Can be tested with a set of pre-extracted narratives by running clustering and verifying groupings on the map. Delivers value by surfacing thematic patterns.

**Acceptance Scenarios**:

1. **Given** 50+ extracted narratives with embeddings, **When** the Admin opens the clustering view, **Then** all narratives are plotted on a 2D semantic map.
2. **Given** the semantic map, **When** the Admin adjusts the cluster size slider and clicks "Run Clustering", **Then** the map updates within 10 seconds showing color-coded clusters.
3. **Given** generated clusters, **When** the Admin clicks on a cluster, **Then** they see an AI-generated name, summary, popularity percentage, and the list of narratives in that cluster.
4. **Given** clusters, **When** the Admin views cluster metrics, **Then** they see popularity (% of total narratives), average sentiment, and inter-cluster similarity scores.
5. **Given** unsatisfactory clustering results, **When** the Admin changes parameters and re-runs, **Then** new clusters are generated without losing the previous run's data.

---

### User Story 5 - Analytics Dashboard (Priority: P3)

The Admin views a project dashboard with an overview of key metrics: total interviews completed, total narratives extracted, number of clusters, average sentiment, and participation rate. The dashboard includes an interactive semantic map showing clusters and their relationships, a sentiment heatmap by category (department, role), and filterable views. An analytic chat allows the Admin to query insights in natural language (e.g., "What are the most negative clusters in the sales department?").

**Why this priority**: The dashboard is the presentation layer. It aggregates data from interviews, narratives, and clusters into a consumable format. Depends on all prior stories.

**Independent Test**: Can be tested with pre-populated project data by verifying that all metrics render correctly and filters work. Delivers value by providing at-a-glance project insights.

**Acceptance Scenarios**:

1. **Given** a project with completed interviews, narratives, and clusters, **When** the Admin opens the dashboard, **Then** they see summary metric cards (interviews, narratives, clusters, avg sentiment) loading within 2 seconds.
2. **Given** the dashboard, **When** the Admin clicks on the semantic map, **Then** they can zoom, pan, and click individual narratives or clusters for detail.
3. **Given** the dashboard, **When** the Admin applies a filter by department, **Then** all metrics and visualizations update to reflect only that department's data.
4. **Given** the analytic chat, **When** the Admin types "What tensions exist between engineering and product?", **Then** the system returns relevant clusters and narrative excerpts within 10 seconds.
5. **Given** the dashboard with a sentiment heatmap, **When** the Admin hovers over a cell, **Then** they see the category name, average sentiment score, and narrative count.

---

### User Story 6 - Shared Read-Only Views (Priority: P3)

The Admin generates a shareable read-only link for a project's dashboard or specific clustering results. A Viewer (e.g., an executive or HR partner) opens the link and can browse the dashboard, semantic map, and cluster details without editing capabilities. The Viewer can also use the analytic chat to query insights.

**Why this priority**: Sharing enables the platform's value to reach decision-makers who don't run the analysis. Depends on dashboard (P3).

**Independent Test**: Can be tested by generating a share link and opening it in an incognito browser. Delivers value by enabling stakeholder access without accounts.

**Acceptance Scenarios**:

1. **Given** an active project, **When** the Admin clicks "Generate Share Link", **Then** a unique read-only URL is created with an optional expiration date.
2. **Given** a valid share link, **When** a Viewer opens it, **Then** they see the dashboard in read-only mode without any edit controls.
3. **Given** a read-only view, **When** the Viewer uses the analytic chat, **Then** they can query insights and see results identical to the Admin's view.
4. **Given** an expired share link, **When** a Viewer opens it, **Then** they see a clear message that the link is no longer valid.

---

### Edge Cases

- What happens when an employee's browser loses connection mid-interview? The system MUST auto-save transcript progress and allow resumption from the last saved point within 24 hours.
- What happens when the AI model service is temporarily unavailable during an RTI session? The system MUST queue the employee's response and retry within 30 seconds, showing a "thinking" indicator. After 3 retries, it MUST automatically switch to the configured fallback AI provider. If the fallback also fails, it MUST offer to continue via text-only mode or save and resume later.
- What happens when the primary AI provider fails during non-RTI operations (narrative extraction, clustering, analytic chat)? The system MUST automatically attempt the operation with the fallback AI provider. If both providers fail, the system MUST notify the Admin with the error details and a manual retry option.
- What happens when a CSV upload contains duplicate or malformed email addresses? The system MUST skip duplicates, flag malformed entries, and report which rows were skipped with reasons.
- What happens when narrative extraction produces fewer than 10 fragments from a short interview? The system MUST accept the result and flag the interview as "low-yield" for the Admin's review.
- What happens when clustering is run with fewer than the minimum cluster size of narratives? The system MUST display a warning that insufficient data exists and suggest lowering the minimum cluster size parameter.
- What happens when two Admins edit the same project simultaneously? The system MUST use last-write-wins with visible timestamps showing when each field was last modified.
- What happens when the anonymization engine misses a name? The Admin MUST be able to manually edit any narrative to redact missed identifying information.

## Requirements _(mandatory)_

### Functional Requirements

**Project Management**

- **FR-001**: System MUST allow authenticated Admins to create, edit, and delete discovery projects with name, description, and status.
- **FR-002**: System MUST allow Admins to define custom demographic categories (e.g., role, department, seniority, location) per project.
- **FR-003**: System MUST allow Admins to invite employees via individual email entry or CSV upload (columns: email, optional category values).
- **FR-004**: System MUST generate a unique, anonymous interview link per invited employee. The link remains active until the interview is completed or the invitation expires.
- **FR-005**: System MUST send invitation emails containing the anonymous interview link.
- **FR-006**: System MUST track invitation status (sent, opened, in-progress, completed, expired).

**Real-Time Interviewer (RTI)**

- **FR-007**: System MUST provide a conversational AI interview interface accessible via anonymous link without account creation.
- **FR-008**: System MUST support both text input and voice input (speech-to-text) during interviews.
- **FR-009**: System MUST follow a structured interview guide covering: welcome/anonymity explanation, role/tenure collection, culture, facilitators/barriers, cross-area collaboration, decision-making, and change.
- **FR-010**: System MUST generate adaptive follow-up questions that push toward concrete stories rather than opinions or generalizations.
- **FR-011**: System MUST include periodic anonymity reminders during the interview (every 5-7 questions).
- **FR-012**: System MUST auto-save interview transcripts in real time (at minimum every 30 seconds or after each exchange).
- **FR-013**: System MUST gracefully close interviews after all themes are covered or after 45 minutes, whichever comes first.

**Narrative Engine**

- **FR-014**: System MUST extract 10-30 narrative fragments from each completed interview transcript using AI-powered chunking (identifying beginning-tension-resolution structure).
- **FR-015**: System MUST score each narrative for sentiment on a scale of -2 (very negative) to +2 (very positive).
- **FR-016**: System MUST score each narrative for abstraction level on a scale of 1 (concrete story) to 4 (high-level opinion).
- **FR-017**: System MUST automatically anonymize narratives by detecting and replacing personal names and identifying information with generic placeholders.
- **FR-018**: System MUST generate vector embeddings for each narrative to enable semantic similarity comparison.
- **FR-019**: System MUST support batch extraction across multiple interviews with progress tracking.
- **FR-020**: System MUST allow Admins to manually edit narrative text, tags, sentiment, and abstraction scores.

**Clustering**

- **FR-021**: System MUST display narratives on a 2D semantic map using dimensionality reduction of their embeddings.
- **FR-022**: System MUST allow Admins to configure clustering parameters: neighbor count, minimum distance, minimum cluster size, and similarity threshold.
- **FR-023**: System MUST group narratives into clusters based on semantic similarity using the configured parameters.
- **FR-024**: System MUST generate AI-powered names and summaries for each cluster (e.g., "Tension: Lack of cross-departmental flow").
- **FR-025**: System MUST calculate and display cluster metrics: popularity (% of total narratives), average sentiment, and inter-cluster similarity.
- **FR-026**: System MUST allow re-running clustering with different parameters without losing previous results.

**Dashboard & Analytics**

- **FR-027**: System MUST display a project dashboard using a "Sidebar + Single View" layout. The sidebar provides navigation between primary views: "Overview" (Metrics), "Semantic Map", "Heatmap", and "Analytic Chat". Only one major visualization is active at a time to maximize screen real estate.
- **FR-028**: System MUST display an interactive semantic map of clusters with zoom, pan, and click-to-detail functionality.
- **FR-029**: System MUST display a sentiment heatmap filterable by demographic categories.
- **FR-030**: System MUST provide an analytic chat where Admins can query narratives and clusters in natural language.
- **FR-031**: System MUST support filtering all dashboard views by demographic categories and tags.
- **FR-043**: System MUST allow Admins to export narratives and cluster reports as CSV and PDF.

**Sharing & Access**

- **FR-032**: System MUST allow Admins to generate shareable read-only links with optional expiration dates.
- **FR-033**: System MUST provide Viewers with read-only access to dashboards, semantic maps, cluster details, and analytic chat.
- FR-034: System MUST support project-level permissions where a user can have different roles (Admin, Viewer) across different projects. "Employee" remains an anonymous role scoped to a specific interview link.
- **FR-044**: System MUST allow project owners to add other Admins as collaborators on a project. Collaborators have full edit access; only the owner can delete the project.
- **FR-045**: System MUST support configuring a primary and a fallback AI provider. If the primary provider fails (after 3 retries with exponential backoff), the system MUST automatically attempt the operation with the fallback provider before surfacing an error.

- FR-046: System MUST allow new users to self-register as Admins using Email/Password or Google OAuth.
- FR-047: System MUST provide a password reset flow via email link.

**Privacy & Anonymization**

- **FR-035**: System MUST store interview transcripts separately from anonymized narratives, with Admin-only access to transcripts.
- **FR-036**: System MUST apply named entity recognition to automatically detect and redact personal identifiers in narratives.
- **FR-037**: System MUST never expose the identity of an interviewee in any dashboard, narrative, cluster, or shared view.
- **FR-038**: System MUST allow Admins to manually trigger re-anonymization on any narrative.

**User Interface**

- **FR-039**: System MUST provide a responsive interface usable on desktop and mobile devices.
- **FR-040**: System MUST support dark mode and light mode.
- **FR-041**: System MUST support Spanish and English languages with user-selectable locale.
- **FR-042**: System MUST meet accessibility standards with keyboard navigation and screen reader support.

### Key Entities

- **Project**: Represents a discovery initiative. Attributes: name, description, status (draft/active/closed), demographic categories, creation date, owner (Admin), collaborators (list of Admins with edit access; only the owner can delete the project). Has many Interviews, Narratives, Clusters.
- **User**: A person with platform access. Attributes: email, display name, role (Admin/Viewer), locale preference. An Admin owns many Projects.
- **Invitation**: A link between a Project and an employee email. Attributes: email, anonymous token, category values (role, dept, etc.), status (sent/opened/in-progress/completed/expired), creation date, expiration date (optional, no expiration by default).
- **Interview**: A completed conversational session. Attributes: anonymous token (links to Invitation), transcript (ordered messages), duration, start/end timestamps, status (in-progress/completed/abandoned), theme coverage progress. Belongs to a Project.
- **Narrative**: An extracted story fragment. Attributes: text (anonymized), sentiment score (-2 to +2), abstraction level (1-4), source interview reference, embedding vector, tags (user-defined), anonymization status. Belongs to an Interview and a Project.
- **Cluster**: A group of semantically similar narratives. Attributes: AI-generated name, AI-generated summary, parameter snapshot (neighbors, min_dist, min_cluster_size, threshold), popularity %, average sentiment, member narrative IDs. Belongs to a Project and a Clustering Run.
- **ClusteringRun**: A snapshot of a clustering execution. Attributes: parameters used, timestamp, cluster count, status. Belongs to a Project. Has many Clusters.
- **Tag**: A user-defined classification label. Attributes: name, category, description, example phrases. Belongs to a Project. Many-to-many with Narratives.
- **ShareLink**: A read-only access token. Attributes: URL token, project reference, scope (full dashboard / specific view), expiration date, created by (Admin).

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: An Admin can create a project and send 50 interview invitations within 5 minutes.
- **SC-002**: An employee can complete an AI-guided interview in 15-45 minutes, producing a full transcript.
- **SC-003**: 90% of AI follow-up questions during interviews successfully redirect vague opinions toward concrete stories (abstraction score decreases by at least 1 level in the subsequent response).
- **SC-004**: Narrative extraction processes a 30-minute interview transcript and produces 10-30 fragments within 60 seconds.
- **SC-005**: 95% of personal names in narratives are automatically detected and anonymized without manual intervention.
- **SC-006**: Clustering of 500 narratives completes and renders on the semantic map within 15 seconds.
- **SC-007**: Dashboard loads all summary metrics and the semantic map within 2 seconds for projects with up to 1,000 narratives.
- **SC-008**: The analytic chat returns relevant narrative and cluster results within 10 seconds for natural language queries.
- **SC-009**: Shared read-only links provide full dashboard access without exposing any identifying employee information.
- **SC-010**: The platform is fully usable in both Spanish and English, with all AI-generated content respecting the project's configured language.
- **SC-011**: The RTI auto-saves progress, allowing an interrupted interview to be resumed from the last exchange within 24 hours.
- **SC-012**: All pages are navigable via keyboard and compatible with screen readers.

## Clarifications

### Session 2026-02-15

- Q: Should the MVP include data export capabilities for narratives and cluster reports? → A: Yes, Admins can export narratives and cluster reports as CSV and PDF.
- Q: Should interview links be single-use or reusable? → A: Multi-use -- link remains active until the interview is completed or the invitation expires.
- Q: What is the default expiration period for invitations? → A: No expiration by default; Admin can optionally set an expiration date per invitation.
- Q: Can multiple Admins collaborate on a single project? → A: Yes, Owner + Collaborator model. Owner can delete project; collaborators have full edit access.
- Q: How should the system handle AI provider failures across all AI-dependent features? → A: Primary + fallback provider. System auto-switches to fallback provider if primary fails; errors surface only if both fail.
- Q: How do Admins (Consultants) acquire an account? → A: Public Self-Registration via Email/Password or Google.
- Q: How are user permissions scoped? → A: Project-Level Permissions (User roles like Admin/Viewer are specific to each project, not global to the user account).
- Q: How should the dashboard be visually structured? → A: Sidebar + Single View (Tabs for Map vs Heatmap vs Metrics).
