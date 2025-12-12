from flask import Flask, render_template, jsonify, request
from flask_cors import CORS
from core.graph import RoadGraph
from core.algorithms import dijkstra, a_star
from core.constraints import ConstraintsManager
import csv
import os

app = Flask(__name__,
            template_folder='../frontend/templates',
            static_folder='../frontend/static')
CORS(app)

DATA_DIR = os.path.join(os.path.dirname(__file__), '..', 'data')
NODES_CSV = os.path.join(DATA_DIR, 'nodes.csv')
EDGES_CSV = os.path.join(DATA_DIR, 'edges.csv')
CONSTRAINTS_CSV = os.path.join(DATA_DIR, 'constraints', 'constraints_edges.csv')

graph = RoadGraph()
constraints_manager = None
edges_data_list = []

def load_graph_data():
    global graph, constraints_manager, edges_data_list

    graph = RoadGraph()
    edges_data_list = []

    # Load Nodes
    if not os.path.exists(NODES_CSV):
        print(f"Error: nodes.csv not found at {NODES_CSV}")
        return False

    try:
        with open(NODES_CSV, 'r', encoding='utf-8-sig') as f:
            reader = csv.DictReader(f)
            for row in reader:
                graph.add_node(
                    int(row['node_id']),
                    float(row['latitude']),
                    float(row['longitude'])
                )
        print(f"Loaded {len(graph.nodes)} nodes")
    except Exception as e:
        print(f"Error loading nodes: {e}")
        return False

    # Load Edges
    if not os.path.exists(EDGES_CSV):
        print(f"Error: edges.csv not found at {EDGES_CSV}")
        return False

    try:
        with open(EDGES_CSV, 'r', encoding='utf-8-sig') as f:
            reader = csv.DictReader(f)
            for row in reader:
                edge_info = {
                    'edge_id': int(row['edge_id']),
                    'from_node': int(row['from_node']),
                    'to_node': int(row['to_node']),
                    'distance': float(row['distance']),
                    'is_oneway': int(row['is_oneway'])
                }
                edges_data_list.append(edge_info)
                
                graph.add_edge(
                    edge_info['edge_id'],
                    edge_info['from_node'],
                    edge_info['to_node'],
                    edge_info['distance'],
                    edge_info['is_oneway']
                )
        print(f"Loaded {len(graph.edges)} edges")
    except Exception as e:
        print(f"Error loading edges: {e}")
        return False
    
    # Load constraints
    constraints_manager = ConstraintsManager(CONSTRAINTS_CSV)
    constraints = constraints_manager.get_all_constraints()

    # Thêm constraints vào graph
    for constraint in constraints:
        graph.add_constraint(
            constraint['edge_id'],
            constraint['constraint_type'],
            constraint['value'],
            constraint['description']
        )
    
    # Rebuild adjacency
    graph.rebuild_adjacency()

    print(f"Loaded {len(constraints)} constraints")
    return True

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/admin')
def admin():
    return render_template('admin.html')

@app.route('/api/nodes')
def get_nodes():
    nodes_list = [
        {
            'node_id': node_id,
            'latitude': lat,
            'longitude': lon
        }
        for node_id, (lat, lon) in graph.nodes.items()
    ]
    return jsonify(nodes_list)

@app.route('/api/edges')
def get_edges():
    edges_list = [
        {
            'edge_id': edge_id,
            'from_node': edge['from_node'],
            'to_node': edge['to_node'],
            'distance': edge['distance'],
            'is_oneway': edge['is_oneway']
        }
        for edge_id, edge in graph.edges.items()
    ]
    return jsonify(edges_list)

@app.route('/api/constraints')
def get_constraints():
    constraints = constraints_manager.get_all_constraints()
    return jsonify(constraints)

@app.route('/api/find-nearest', methods=['POST'])
def find_nearest():
    data = request.json
    lat = float(data['latitude'])
    lon = float(data['longitude'])

    nearest_node, distance = graph.find_nearest_node(lat, lon)

    return jsonify({
        'node_id': nearest_node,
        'distance': distance
    })

@app.route('/api/find-path', methods=['POST'])
def find_path():
    data = request.json
    start_lat = float(data['start_lat'])
    start_lon = float(data['start_lon'])
    end_lat = float(data['end_lat'])
    end_lon = float(data['end_lon'])
    algorithm = data.get('algorithm', 'dijkstra')

    start_node, start_distance = graph.find_nearest_node(start_lat, start_lon)
    end_node, end_distance = graph.find_nearest_node(end_lat, end_lon)

    if algorithm == 'a_star':
        path, total_distance = a_star(graph, start_node, end_node)
    else:
        path, total_distance = dijkstra(graph, start_node, end_node)

    if path is None:
        return jsonify({'error': 'No path found'}), 404

    path_coordinates = []
    for node_id in path:
        lat, lon = graph.nodes[node_id]
        path_coordinates.append({'lat': lat, 'lon': lon, 'node_id': node_id})

    total_distance_with_endpoints = total_distance + start_distance + end_distance

    path_string = ' → '.join([str(node_id) for node_id in path])

    return jsonify({
        'path': path,
        'path_coordinates': path_coordinates,
        'path_string': path_string,
        'graph_distance': total_distance,
        'start_offset': start_distance,
        'end_offset': end_distance,
        'total_distance': total_distance_with_endpoints,
        'num_nodes': len(path)
    })

@app.route('/api/edges-in-polygon', methods=['POST'])
def edges_in_polygon():
    data = request.json
    polygon = data['polygon']

    def point_in_polygon(point, polygon):
        x, y = point
        n = len(polygon)
        inside = False

        p1x, p1y = polygon[0]
        for i in range(1, n + 1):
            p2x, p2y = polygon[i % n]
            if y > min(p1y, p2y):
                if y <= max(p1y, p2y):
                    if x <= max(p1x, p2x):
                        if p1y != p2y:
                            xinters = (y - p1y) * (p2x - p1x) / (p2y - p1y) + p1x
                        if p1x == p2x or x <= xinters:
                            inside = not inside
            p1x, p1y = p2x, p2y

        return inside

    affected_edges = []

    for edge_id, edge in graph.edges.items():
        from_node = edge['from_node']
        to_node = edge['to_node']

        from_lat, from_lon = graph.nodes[from_node]
        to_lat, to_lon = graph.nodes[to_node]

        if point_in_polygon((from_lat, from_lon), polygon) or \
           point_in_polygon((to_lat, to_lon), polygon):
            affected_edges.append({
                'edge_id': edge_id,
                'from_node': from_node,
                'to_node': to_node,
                'distance': edge['distance']
            })

    return jsonify({'edges': affected_edges})

@app.route('/api/edges-in-circle', methods=['POST'])
def edges_in_circle():
    data = request.json
    center_lat = float(data['center_lat'])
    center_lon = float(data['center_lon'])
    radius = float(data['radius'])

    affected_edges = []

    for edge_id, edge in graph.edges.items():
        from_node = edge['from_node']
        to_node = edge['to_node']

        from_lat, from_lon = graph.nodes[from_node]
        to_lat, to_lon = graph.nodes[to_node]

        from_distance = graph.haversine_distance(center_lat, center_lon, from_lat, from_lon)
        to_distance = graph.haversine_distance(center_lat, center_lon, to_lat, to_lon)

        if from_distance <= radius or to_distance <= radius:
            affected_edges.append({
                'edge_id': edge_id,
                'from_node': from_node,
                'to_node': to_node,
                'distance': edge['distance']
            })

    return jsonify({'edges': affected_edges})

@app.route('/api/add-constraints', methods=['POST'])
def add_constraints():
    data = request.json
    edge_ids = data['edge_ids']
    constraint_type = data['constraint_type']
    value = data['value']
    description = data.get('description', '')

    # Check ONEWAY CONSTRAINT - BOTH
    if constraint_type == 'oneway' and value =='both':
        invalid_edges = []

        # Tạo dict từ edges_data_list để lookup nhanh hơn
        edges_dict = {e['edge_id']: e for e in edges_data_list}

        for edge_id in edge_ids:
            edge = edges_dict.get(edge_id)
            
            if edge:
                # Kiểm tra edge có phải là một chiều gốc không
                # is_oneway = 1: một chiều, is_oneway = 0: hai chiều
                if edge.get('is_oneway', 0) == 0:
                    invalid_edges.append(edge_id)
            else:
                # Edge không tồn tại
                invalid_edges.append(edge_id)
        
        if invalid_edges:
            return jsonify({
                'success': False,
                'error': f'"both" constraint chỉ áp dụng cho đường một chiều gốc. ' +
                        f'Các edge sau là hai chiều hoặc không tồn tại: {invalid_edges}'
            }), 400
    
    # Thêm constraints nếu validation passed
    for edge_id in edge_ids:
        constraints_manager.add_constraint(
            edge_id,
            constraint_type,
            value,
            description
        ) 

    load_graph_data()
    return jsonify({'success': True})

@app.route('/api/remove-constraint/<int:edge_id>', methods=['DELETE'])
def remove_constraint(edge_id):
    success = constraints_manager.remove_constraint(edge_id)

    if success:
        load_graph_data()
        return jsonify({'success': True})
    else:
        return jsonify({'success': False, 'error': 'Failed to remove constraint'}), 500

@app.route('/api/clear-constraints', methods=['POST'])
def clear_constraints():
    success = constraints_manager.clear_all_constraints()

    if success:
        load_graph_data()
        return jsonify({'success': True})
    else:
        return jsonify({'success': False, 'error': 'Failed to clear constraints'}), 500

@app.route('/api/reload-graph', methods=['POST'])
def reload_graph():
    load_graph_data()
    return jsonify({'success': True})

if __name__ == '__main__':
    if load_graph_data():
        print("Starting Flask server on http://localhost:5000")
        app.run(debug=True, host='0.0.0.0', port=5000)
    else:
        print("Failed to load graph data. Please check your CSV files.")
