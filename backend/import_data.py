import csv
import os

def import_nodes(csv_path):
    print(f"Importing nodes from {csv_path}...")

    with open(csv_path, 'r', encoding='utf-8-sig') as f:
        reader = csv.DictReader(f)
        nodes = []

        for row in reader:
            nodes.append({
                'node_id': int(row['node_id']),
                'latitude': float(row['latitude']),
                'longitude': float(row['longitude'])
            })

    print(f"Successfully imported {len(nodes)} nodes")

def import_edges(csv_path):
    print(f"Importing edges from {csv_path}...")

    with open(csv_path, 'r', encoding='utf-8-sig') as f:
        reader = csv.DictReader(f)
        edges = []

        for row in reader:
            edges.append({
                'edge_id': int(row['edge_id']),
                'from_node': int(row['from_node']),
                'to_node': int(row['to_node']),
                'distance': float(row['distance']),
                'is_oneway': int(row['is_oneway'])
            })

    print(f"Successfully imported {len(edges)} edges")

def import_constraints(csv_path):
    if not os.path.exists(csv_path):
        print(f"Constraints file not found: {csv_path}")
        return

    print(f"Importing constraints from {csv_path}...")

    with open(csv_path, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        constraints = []

        for row in reader:
            constraints.append({
                'edge_id': int(row['edge_id']),
                'constraint_type': row['constraint_type'],
                'value': row['value'],
                'description': row.get('description', '')
            })

    print(f"Successfully imported {len(constraints)} constraints")

if __name__ == '__main__':
    data_dir = '../data'

    nodes_path = os.path.join(data_dir, 'nodes.csv')
    edges_path = os.path.join(data_dir, 'edges.csv')
    constraints_path = os.path.join(data_dir, 'constraints', 'constraints_edges.csv')

    if os.path.exists(nodes_path):
        import_nodes(nodes_path)
    else:
        print(f"Nodes file not found: {nodes_path}")

    if os.path.exists(edges_path):
        import_edges(edges_path)
    else:
        print(f"Edges file not found: {edges_path}")

    if os.path.exists(constraints_path):
        import_constraints(constraints_path)

    print("\nData import completed!")
