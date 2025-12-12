import math
from typing import Dict, List, Tuple, Optional

class RoadGraph:
    def __init__(self):
        self.nodes: Dict[int, Tuple[float, float]] = {}
        self.edges: Dict[int, Dict] = {}
        self.adjacency: Dict[int, List[Tuple[int, int, float]]] = {}
        self.constraints: Dict[int, Dict] = {}

    def add_node(self, node_id: int, latitude: float, longitude: float):
        self.nodes[node_id] = (latitude, longitude)

    def add_edge(self, edge_id: int, from_node: int, to_node: int, distance: float, is_oneway: int):
        self.edges[edge_id] = {
            'from_node': from_node,
            'to_node': to_node,
            'distance': distance,
            'is_oneway': is_oneway
        }

        if from_node not in self.adjacency:
            self.adjacency[from_node] = []
        if to_node not in self.adjacency:
            self.adjacency[to_node] = []

    def add_constraint(self, edge_id: int, constraint_type: str, value: str, description: str = ""):
        self.constraints[edge_id] = {
            'type': constraint_type,
            'value': value,
            'description': description
        }

    def clear_constraints(self):
        self.constraints.clear()

    def rebuild_adjacency(self):
        self.adjacency.clear()

        for edge_id, edge in self.edges.items():
            from_node = edge['from_node']
            to_node = edge['to_node']
            distance = edge['distance']
            is_oneway = edge['is_oneway']

            constraint = self.constraints.get(edge_id)

            # 1. Kiểm tra block constraint
            if constraint and constraint['type'] == 'block':
                continue # Bỏ qua

            # 2. Xử lý oneway constraint
            if constraint and constraint['type'] == 'oneway':
                direction = constraint['value']

                if direction == 'forward':
                    # Chỉ thêm chiều từ from_node → to_node
                    self._add_to_adjacency(from_node, to_node, edge_id, distance)
                elif direction == 'backward':
                    # Chỉ thêm chiều từ to_node → from_node
                    self._add_to_adjacency(to_node, from_node, edge_id, distance)
                elif direction == 'both':
                    # Thêm cả 2 chiều (cho đường 1 chiều gốc)
                    self._add_to_adjacency(from_node, to_node, edge_id, distance)
                    self._add_to_adjacency(to_node, from_node, edge_id, distance)
            else:
                # 3. Không có constraint oneway, sử lý theo loại edge gốc
                if is_oneway == 1:
                    # Edge 1 chiều gốc
                    self._add_to_adjacency(from_node, to_node, edge_id, distance)
                else: 
                    # Edge 2 chiều gốc (normal)
                    self._add_to_adjacency(from_node, to_node, edge_id, distance)
                    self._add_to_adjacency(to_node, from_node, edge_id, distance)

    def _add_to_adjacency(self, from_node: int, to_node: int, edge_id: int, distance: float):
            """Helper method để thêm edge vào adjacency list"""
            if from_node not in self.adjacency:
                self.adjacency[from_node] = []
            self.adjacency[from_node].append((to_node, edge_id, distance))

    def get_edge_cost(self, edge_id: int, base_distance: float) -> Optional[float]:
        if edge_id not in self.constraints:
            return base_distance

        constraint = self.constraints[edge_id]

        if constraint['type'] == 'block':
            return None # Bị block, không thể đi qua

        elif constraint['type'] == 'penalty':
            try:
                penalty_factor = float(constraint['value'])
                return base_distance * penalty_factor
            except ValueError:
                return base_distance

        return base_distance

    def is_edge_allowed(self, edge_id: int, from_node: int, to_node: int) -> bool:
        
        if edge_id not in self.constraints:
            return True
        
        constraint = self.constraints[edge_id]

        if constraint['type'] == 'block':
            return False
        
        return True

    def get_neighbors(self, node_id: int) -> List[Tuple[int, int, float]]:
        
        """Lấy danh sách neighbors của node, đã tính đến constraints"""
        neighbors = []
        if node_id in self.adjacency:
            for neighbor_id, edge_id, distance in self.adjacency[node_id]:
                if self.is_edge_allowed(edge_id, node_id, neighbor_id):
                    cost = self.get_edge_cost(edge_id, distance)
                    if cost is not None:
                        neighbors.append((neighbor_id, edge_id, cost))
        return neighbors

    @staticmethod
    def haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
        R = 6371000

        phi1 = math.radians(lat1)
        phi2 = math.radians(lat2)
        delta_phi = math.radians(lat2 - lat1)
        delta_lambda = math.radians(lon2 - lon1)

        a = math.sin(delta_phi / 2) ** 2 + \
            math.cos(phi1) * math.cos(phi2) * math.sin(delta_lambda / 2) ** 2
        c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))

        return R * c

    def find_nearest_node(self, latitude: float, longitude: float) -> Tuple[int, float]:
        min_distance = float('inf')
        nearest_node = None

        for node_id, (node_lat, node_lon) in self.nodes.items():
            distance = self.haversine_distance(latitude, longitude, node_lat, node_lon)
            if distance < min_distance:
                min_distance = distance
                nearest_node = node_id

        return nearest_node, min_distance