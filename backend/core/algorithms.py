import heapq
import math
from typing import List, Tuple, Optional, Dict
from .graph import RoadGraph

def dijkstra(graph: RoadGraph, start: int, end: int) -> Tuple[Optional[List[int]], Optional[float]]:
    if start not in graph.nodes or end not in graph.nodes:
        return None, None

    distances: Dict[int, float] = {node: float('inf') for node in graph.nodes}
    distances[start] = 0
    previous: Dict[int, Optional[int]] = {node: None for node in graph.nodes}

    priority_queue = [(0, start)]
    visited = set()

    while priority_queue:
        current_distance, current_node = heapq.heappop(priority_queue)

        if current_node in visited:
            continue

        visited.add(current_node)

        if current_node == end:
            break

        if current_distance > distances[current_node]:
            continue

        for neighbor_id, edge_id, cost in graph.get_neighbors(current_node):
            distance = current_distance + cost

            if distance < distances[neighbor_id]:
                distances[neighbor_id] = distance
                previous[neighbor_id] = current_node
                heapq.heappush(priority_queue, (distance, neighbor_id))

    if distances[end] == float('inf'):
        return None, None

    path = []
    current = end
    while current is not None:
        path.append(current)
        current = previous[current]

    path.reverse()

    return path, distances[end]

def a_star(graph: RoadGraph, start: int, end: int) -> Tuple[Optional[List[int]], Optional[float]]:
    if start not in graph.nodes or end not in graph.nodes:
        return None, None

    def heuristic(node_id: int) -> float:
        node_lat, node_lon = graph.nodes[node_id]
        end_lat, end_lon = graph.nodes[end]
        return graph.haversine_distance(node_lat, node_lon, end_lat, end_lon)

    g_score: Dict[int, float] = {node: float('inf') for node in graph.nodes}
    g_score[start] = 0

    f_score: Dict[int, float] = {node: float('inf') for node in graph.nodes}
    f_score[start] = heuristic(start)

    previous: Dict[int, Optional[int]] = {node: None for node in graph.nodes}

    open_set = [(f_score[start], start)]
    visited = set()

    while open_set:
        current_f, current_node = heapq.heappop(open_set)

        if current_node in visited:
            continue

        visited.add(current_node)

        if current_node == end:
            break

        for neighbor_id, edge_id, cost in graph.get_neighbors(current_node):
            tentative_g_score = g_score[current_node] + cost

            if tentative_g_score < g_score[neighbor_id]:
                previous[neighbor_id] = current_node
                g_score[neighbor_id] = tentative_g_score
                f_score[neighbor_id] = tentative_g_score + heuristic(neighbor_id)
                heapq.heappush(open_set, (f_score[neighbor_id], neighbor_id))

    if g_score[end] == float('inf'):
        return None, None

    path = []
    current = end
    while current is not None:
        path.append(current)
        current = previous[current]

    path.reverse()

    return path, g_score[end]
