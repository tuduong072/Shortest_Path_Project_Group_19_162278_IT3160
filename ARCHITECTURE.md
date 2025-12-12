# Architecture Documentation

## System Overview

This is a web-based routing system for Hoàng Liệt ward with real-time constraint management. The system uses Flask backend with vanilla JavaScript frontend and  PostgreSQL database.

## Technology Stack

### Backend
- **Flask 3.0**: Web framework
- **Python 3.8+**: Core language

### Frontend
- **Leaflet 1.9.4**: Interactive maps
- **Leaflet.Draw 1.0.4**: Drawing tools for admin
- **Vanilla JavaScript**: No heavy frameworks
- **CSS3**: Modern styling with gradients and animations

### Database

- **Row Level Security**: Built-in security

### Algorithms
- **Dijkstra**: Classic shortest path
- **A* (A-Star)**: Heuristic-based pathfinding with Haversine distance

## System Architecture

\`\`\`
┌─────────────────────────────────────────────────────────────┐
│                         Frontend                            │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐       │
│  │  User UI     │  │  Admin UI    │  │   Leaflet    │       │
│  │  (index.html)│  │ (admin.html) │  │   Maps       │       │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘       │
│         │                 │                  │              │
│         └─────────┬───────┴──────────────────┘              │
│                   │ AJAX/Fetch API                          │
└───────────────────┼─────────────────────────────────────────┘
                    │
┌───────────────────┼──────────────────────────────────────────┐
│                   ▼          Flask Backend                   │
│         ┌─────────────────┐                                  │
│         │   app.py        │  Main application                │
│         │   (Routes)      │                                  │
│         └────────┬────────┘                                  │
│                  │                                           │
│         ┌────────┴────────┐                                  │
│         │                 │                                  │
│    ┌────▼─────┐    ┌─────▼──────┐      ┌───────────┐         │
│    │ graph.py │    │algorithms.py│     │constraints│         │
│    │          │    │             │     │   .py     │         │
│    │ RoadGraph│    │ Dijkstra    │     │ Manager   │         │
│    │ Haversine│    │ A*          │     │           │         │
│    └──────────┘    └─────────────┘     └─────┬─────┘         │
│                                              │               │
└──────────────────────────────────────────────┼───────────────┘
                                               │
┌──────────────────────────────────────────────▼───────────────┐
│                     CSV                                      │
│  ┌──────────┐  ┌──────────┐  ┌────────────────────┐          │
│  │  nodes   │  │  edges   │  │ constraints_edges  │          │
│  │          │  │          │  │                    │          │
│  │ 949 rows │  │2322 rows │  │   Dynamic data     │          │
│  └──────────┘  └──────────┘  └────────────────────┘          │
│                                                              │
│  Row Level Security (RLS): Public read, Authenticated write  │
└──────────────────────────────────────────────────────────────┘
\`\`\`

## Core Components

### 1. RoadGraph (graph.py)

**Purpose:** Represents the road network as a graph structure

**Key Features:**
- Node storage with lat/lon coordinates
- Edge storage with distance and direction
- Adjacency list for efficient neighbor lookup
- Constraint management integration
- Haversine distance calculation

**Methods:**
\`\`\`python
add_node(node_id, lat, lon)
add_edge(edge_id, from_node, to_node, distance, is_oneway)
add_constraint(edge_id, type, value, description)
clear_constraints()
rebuild_adjacency()
_add_to_adjacency(from_node: int, to_node: int, edge_id: int, distance: float)
get_edge_cost(edge_id, base_distance) → cost with penalties
is_edge_allowed(edge_id, from, to) → check blocks/oneway
get_neighbors(node_id) → [(neighbor, edge, cost), ...]
find_nearest_node(latitude, longitude) → (node_id, distance)
\`\`\`

### 2. Algorithms (algorithms.py)

**Dijkstra Algorithm:**
- Classic shortest path
- Guaranteed optimal solution
- Time complexity: O((V+E) log V)
- Works with all constraint types

**A* Algorithm:**
- Heuristic-based pathfinding
- Uses Haversine distance as heuristic
- Faster than Dijkstra in practice
- Still guarantees optimal path

**Constraint Handling:**
- Block: Returns None cost (skip edge)
- Penalty: Multiplies distance by factor
- Oneway: Checks direction validity

### 3. Constraints Manager (constraints.py)

**Purpose:** Manage dynamic road constraints

**Operations:**
- Load all constraints from database
- Add single constraint
- Add batch constraints
- Remove constraint
- Clear all constraints

**Constraint Types:**

1. **Block (Chặn)**
   - Value: "1.0"
   - Effect: Edge cannot be traversed
   - Use: Road closure, severe flooding

2. **Penalty (Phạt)**
   - Value: Factor >= 1.0 (e.g., "1.5")
   - Effect: Increases edge cost by factor
   - Use: Light flooding, traffic congestion

3. **Oneway (Một chiều)**
   - Value: "forward", "backward", or "both"
   - Effect: Controls traversal direction
   - Use: Temporary one-way streets

### 4. Flask Application (app.py)

**API Endpoints:**

**Public Routes:**
- `GET /` → User interface
- `GET /admin` → Admin interface

**Data APIs:**
- `GET /api/nodes` → All nodes
- `GET /api/edges` → All edges
- `GET /api/constraints` → All constraints

**Pathfinding APIs:**
- `POST /api/find-nearest` → Find nearest node to coordinates
- `POST /api/find-path` → Find path between two points

**Admin APIs:**
- `POST /api/edges-in-polygon` → Find edges in drawn polygon
- `POST /api/edges-in-circle` → Find edges in circle
- `POST /api/add-constraints` → Apply constraints to edges
- `DELETE /api/remove-constraint/<id>` → Remove constraint
- `POST /api/clear-constraints` → Clear all constraints
- `POST /api/reload-graph` → Reload graph from database

### 5. Frontend Components

**User Interface (index.html + map.js):**
- Point selection (click or input)
- Algorithm selection
- Path visualization
- Result display (distance, nodes, path)
- Real-time constraint updates (2s polling)

**Admin Interface (admin.html + admin.js):**
- Area selection (polygon/circle/rectangle)
- Affected edges display
- Constraint configuration
- Real-time map updates
- Constraint management

## Data Flow

### Pathfinding Flow

1. User selects start and end points
2. Frontend finds nearest nodes via `/api/find-nearest`
3. Frontend requests path via `/api/find-path`
4. Backend loads current constraints
5. Backend runs selected algorithm (Dijkstra/A*)
6. Algorithm considers constraints:
   - Skips blocked edges
   - Applies penalty factors
   - Respects oneway directions
7. Returns path with distances
8. Frontend displays path on map

### Constraint Management Flow

1. Admin draws area on map
2. Frontend sends polygon/circle data
3. Backend finds affected edges
4. Frontend displays affected edges
5. Admin configures constraint
6. Frontend sends constraint configuration
7. Backend saves to database
8. Backend reloads graph
9. All clients update via polling

## Database Schema

### nodes Table
\`\`\`sql
CREATE TABLE nodes (
  node_id integer PRIMARY KEY,
  latitude decimal(10, 8) NOT NULL,
  longitude decimal(11, 8) NOT NULL,
  created_at timestamptz DEFAULT now()
);
\`\`\`

### edges Table
\`\`\`sql
CREATE TABLE edges (
  edge_id integer PRIMARY KEY,
  from_node integer REFERENCES nodes(node_id),
  to_node integer REFERENCES nodes(node_id),
  distance decimal(10, 2) NOT NULL,
  is_oneway integer CHECK (is_oneway IN (0, 1)),
  created_at timestamptz DEFAULT now()
);
\`\`\`

### constraints_edges Table
\`\`\`sql
CREATE TABLE constraints_edges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  edge_id integer REFERENCES edges(edge_id) ON DELETE CASCADE,
  constraint_type text CHECK (constraint_type IN ('block', 'penalty', 'oneway')),
  value text NOT NULL,
  description text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
\`\`\`

## Security

### Row Level Security (RLS)

All tables have RLS enabled with following policies:

**Public Read Access:**
- Anyone can read nodes, edges, constraints
- Necessary for routing functionality

**Public Write Access (Constraints):**
- Currently open for demo purposes
- In production: Should require authentication
- Add: `TO authenticated USING (auth.uid() IS NOT NULL)`

### API Security

**Current State:**
- No authentication required
- Suitable for internal/demo use

**Production Recommendations:**
1. Add Flask-Login or JWT authentication
2. Protect admin routes with @login_required
3. Validate all user inputs
4. Rate limit API endpoints
5. Use HTTPS only

## Performance Considerations

### Backend Optimization

1. **In-Memory Graph:**
   - Graph loaded once on startup
   - Cached in memory for fast access
   - Reloaded only when constraints change

2. **Database Indexing:**
   - Indexes on node_id, from_node, to_node
   - Spatial index on node locations
   - Fast constraint lookups

3. **Batch Operations:**
   - Constraint updates in batches
   - Single reload after batch update

### Frontend Optimization

1. **Lazy Loading:**
   - Nodes/edges loaded once
   - Only constraints polled every 2s

2. **Canvas Rendering:**
   - Leaflet uses canvas for smooth rendering
   - Efficient for 2322 edges

3. **Debouncing:**
   - Could add debouncing for input fields
   - Reduce unnecessary API calls

### Algorithm Performance

**Dijkstra:**
- Time: O((V+E) log V) ≈ 0.5-2 seconds for full graph
- Space: O(V) for distance/previous arrays

**A*:**
- Time: Typically faster due to heuristic
- Best case: O(E) with good heuristic
- Worst case: Same as Dijkstra

## Scalability

### Current Limits
- Nodes: ~1,000 (949 in Hoàng Liệt)
- Edges: ~5,000 (2322 in Hoàng Liệt)
- Concurrent users: ~100 (Flask dev server)

### Scaling Options

**Horizontal:**
- Use gunicorn with multiple workers
- Load balancer (nginx)
- Multiple Flask instances

**Vertical:**
- Larger server instance
- More memory for graph caching

**Database:**
- Can handle 1000s of requests/second

**Caching:**
- Redis for graph caching
- Shared across multiple workers

## Monitoring & Logging

### Current Logging
- Flask request logging
- Python print statements
- Browser console logs

### Production Recommendations
1. Structured logging (JSON)
2. Log aggregation (Papertrail, Loggly)
3. Error tracking (Sentry)
4. Performance monitoring (New Relic)
5. Database query monitoring

## Future Enhancements

### Features
1. **User Authentication**
   - Role-based access (admin/user)
   - Constraint history/audit

2. **Advanced Routing**
   - Multi-waypoint routing
   - Alternative routes
   - Route comparison

3. **Time-Based Constraints**
   - Schedule constraints
   - Auto-expiry
   - Rush hour penalties

4. **Analytics**
   - Popular routes
   - Constraint statistics
   - User behavior

5. **Mobile App**
   - React Native or Flutter
   - Offline support
   - GPS integration

### Technical
1. **WebSocket Support**
   - Real-time updates (instead of polling)
   - Flask-SocketIO

2. **API Versioning**
   - /api/v1/...
   - Backward compatibility

3. **Caching Layer**
   - Redis for frequently used paths
   - Cache invalidation on constraint change

4. **Graph Database**
   - Neo4j for complex queries
   - Better graph analytics

## Development Workflow

### Local Development
1. Make changes to code
2. Backend auto-reloads (Flask debug mode)
3. Frontend: Refresh browser
4. Test with sample data

### Testing
- Unit tests for algorithms
- Integration tests for APIs
- E2E tests with Selenium

### Deployment
1. Update code
2. Run migrations if needed
3. Import/update data
4. Restart server
5. Monitor logs

## Troubleshooting Guide

### Common Issues

**Import Error:**
- Check foreign key order (nodes before edges)
- Verify CSV format
- Check for duplicate IDs

**Path Not Found:**
- Verify graph connectivity
- Check for blocking constraints
- Ensure nodes exist

**Performance Issues:**
- Check number of edges
- Monitor memory usage
- Optimize database queries

**Map Issues:**
- Check internet for tiles
- Verify Leaflet version
- Check browser console

## References

- Flask Documentation: https://flask.palletsprojects.com/
- Leaflet Documentation: https://leafletjs.com/
- Dijkstra Algorithm: https://en.wikipedia.org/wiki/Dijkstra%27s_algorithm
- A* Algorithm: https://en.wikipedia.org/wiki/A*_search_algorithm
- Haversine Formula: https://en.wikipedia.org/wiki/Haversine_formula
