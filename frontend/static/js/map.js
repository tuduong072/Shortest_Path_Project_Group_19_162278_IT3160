const MAP_CENTER = [20.962223, 105.830595];
const ZOOM_LEVEL = 15;

const COLORS = {
    block: '#DC2626',
    penalty_flood: '#EA580C',
    penalty_traffic: '#F59E0B',
    oneway: '#0051ffff',
    normal: '#6B7280',
    oneway_original: '#7C3AED',
    path: '#059669',
    startMarker: '#4F46E5',
    endMarker: '#DC2626'
};

let map;
let nodes = [];
let edges = [];
let constraints = [];
let edgeLayerGroup;
let pathLayerGroup;
let markersLayerGroup;
let pickingMode = null;
let startMarker = null;
let endMarker = null;

function initMap() {
    map = L.map('map').setView(MAP_CENTER, ZOOM_LEVEL);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
    }).addTo(map);

    edgeLayerGroup = L.layerGroup().addTo(map);
    pathLayerGroup = L.layerGroup().addTo(map);
    markersLayerGroup = L.layerGroup().addTo(map);

    map.on('click', handleMapClick);
}

function handleMapClick(e) {
    if (pickingMode === 'start') {
        document.getElementById('start-lat').value = e.latlng.lat.toFixed(6);
        document.getElementById('start-lon').value = e.latlng.lng.toFixed(6);

        if (startMarker) {
            markersLayerGroup.removeLayer(startMarker);
        }

        startMarker = L.circleMarker(e.latlng, {
            radius: 8,
            fillColor: COLORS.startMarker,
            color: '#fff',
            weight: 2,
            opacity: 1,
            fillOpacity: 0.8
        }).addTo(markersLayerGroup);

        startMarker.bindPopup('<strong>Điểm bắt đầu</strong>').openPopup();

        pickingMode = null;
        document.getElementById('pick-start').textContent = 'Chọn trên bản đồ';
    } else if (pickingMode === 'end') {
        document.getElementById('end-lat').value = e.latlng.lat.toFixed(6);
        document.getElementById('end-lon').value = e.latlng.lng.toFixed(6);

        if (endMarker) {
            markersLayerGroup.removeLayer(endMarker);
        }

        endMarker = L.circleMarker(e.latlng, {
            radius: 8,
            fillColor: COLORS.endMarker,
            color: '#fff',
            weight: 2,
            opacity: 1,
            fillOpacity: 0.8
        }).addTo(markersLayerGroup);

        endMarker.bindPopup('<strong>Điểm kết thúc</strong>').openPopup();

        pickingMode = null;
        document.getElementById('pick-end').textContent = 'Chọn trên bản đồ';
    }
}

async function loadData() {
    try {
        const [nodesRes, edgesRes, constraintsRes] = await Promise.all([
            fetch('/api/nodes'),
            fetch('/api/edges'),
            fetch('/api/constraints')
        ]);

        nodes = await nodesRes.json();
        edges = await edgesRes.json();
        constraints = await constraintsRes.json();

        drawEdges();
    } catch (error) {
        console.error('Error loading data:', error);
        alert('Lỗi khi tải dữ liệu');
    }
}

function getEdgeDisplayName(edge, constraint=null) {
    if (!edge) return '';


    // Constraint oneway - both direction
    if (constraint && constraint.constraint_type === 'oneway' && constraint.value === 'both') {
        // Đường HAI CHIỀU 
        return `${edge.from_node} ↔ ${edge.to_node}`;
    }

    // Default
    let from = edge.from_node;
    let to = edge.to_node;

    // Constraint oneway - backward direction
    if (constraint && constraint.constraint_type === 'oneway' && constraint.value === 'backward') {
        // Đảo ngược chiều: to_node → from_node
        from = edge.to_node;
        to = edge.from_node;
    }

    return `${from} → ${to}`;
}

function getEdgeColor(edgeId) {
    const edge = edges.find(e => e.edge_id === edgeId);
    const constraint = constraints.find(c => c.edge_id === edgeId);

    // THỨ TỰ ƯU TIÊN CHÍNH:
    // 1. CẤM ĐI (block) - CAO NHẤT
    if (constraint && constraint.constraint_type === 'block') {
        return COLORS.block; // #DC2626 - Đỏ
    }

    // 2. PHẠT (penalty) - TRUNG BÌNH
    if (constraint && constraint.constraint_type === 'penalty') {
        if (constraint.description.toLowerCase().includes('ngập') || constraint.description.toLowerCase().includes('lụt')) {
            return COLORS.penalty_flood; // #EA580C - Cam đậm
        }
        return COLORS.penalty_traffic; // #F59E0B - Vàng cam
    }

    // 3. MỘT CHIỀU TỪ CONSTRAINT
    if (constraint && constraint.constraint_type === 'oneway') {
        return COLORS.oneway; // #0051ffff - Xanh
    }

    // 4. MỘT CHIỀU GỐC
    if (edge && edge.is_oneway === 1) {
        return COLORS.oneway_original; // #7C3AED - Tím
    }

    // 5. MẶC ĐỊNH: Hai chiều thông thường
    return COLORS.normal; // #6B7280 - Xám
}

function drawEdges() {
    edgeLayerGroup.clearLayers();

    edges.forEach(edge => {
        const fromNode = nodes.find(n => n.node_id === edge.from_node);
        const toNode = nodes.find(n => n.node_id === edge.to_node);

        if (fromNode && toNode) {
            const color = getEdgeColor(edge.edge_id);
            const constraint = constraints.find(c => c.edge_id === edge.edge_id);

            const edgeDisplayName = getEdgeDisplayName(edge, constraint);
            
            const line = L.polyline(
                [[fromNode.latitude, fromNode.longitude], [toNode.latitude, toNode.longitude]],
                {
                    color: color,
                    weight: 3,
                    opacity: 0.6
                }
            ).addTo(edgeLayerGroup);

            let popupContent = '<strong>Edge ' + edge.edge_id + '</strong><br>';
            popupContent += edgeDisplayName + '<br>';
            popupContent += 'Khoảng cách: ' + edge.distance.toFixed(1) + 'm<br>';
            popupContent += 'Loại: ' + (edge.is_oneway === 1 ? 'Một chiều' : 'Hai chiều');

            if (constraint) {
                popupContent += '<br><strong>Ràng buộc:</strong> ' + constraint.constraint_type;
                
                // Hiển thị value cho oneway constraint
                if (constraint.constraint_type === 'oneway') {
                    if (constraint.value ==='both') {
                        popupContent += '(hai chiều)';
                    } else if (constraint.value === 'forward') {
                        popupContent += '(một chiều thuận)';
                    } else if (constraint.value === 'backward') {
                        popupContent += '(một chiều nghịch)'
                    }
                }

                if (constraint.description) {
                    popupContent += '<br>' + constraint.description;
                }
            }

            line.bindPopup(popupContent);

            line.on('mouseover', function() {
                this.setStyle({ weight: 5, opacity: 1 });
                this.openPopup();
            });

            line.on('mouseout', function() {
                this.setStyle({ weight: 3, opacity: 0.6 });
            });
        }
    });

    nodes.forEach(node => {
        const marker = L.circleMarker([node.latitude, node.longitude], {
            radius: 3,
            fillColor: '#333',
            color: '#fff',
            weight: 1,
            opacity: 1,
            fillOpacity: 0.6
        }).addTo(edgeLayerGroup);

        marker.bindPopup('<strong>Node ' + node.node_id + '</strong>');

        marker.on('mouseover', function() {
            this.setStyle({ radius: 5, fillOpacity: 1 });
            this.openPopup();
        });

        marker.on('mouseout', function() {
            this.setStyle({ radius: 3, fillOpacity: 0.6 });
        });
    });
}

async function findPath() {
    const startLat = parseFloat(document.getElementById('start-lat').value);
    const startLon = parseFloat(document.getElementById('start-lon').value);
    const endLat = parseFloat(document.getElementById('end-lat').value);
    const endLon = parseFloat(document.getElementById('end-lon').value);
    const algorithm = document.getElementById('algorithm').value;

    if (isNaN(startLat) || isNaN(startLon) || isNaN(endLat) || isNaN(endLon)) {
        alert('Vui lòng nhập đầy đủ tọa độ');
        return;
    }

    try {
        const response = await fetch('/api/find-path', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                start_lat: startLat,
                start_lon: startLon,
                end_lat: endLat,
                end_lon: endLon,
                algorithm: algorithm
            })
        });

        if (!response.ok) {
            throw new Error('Không tìm thấy đường đi');
        }

        const result = await response.json();

        displayPath(result);
        displayResult(result);
    } catch (error) {
        console.error('Error finding path:', error);
        alert('Không tìm thấy đường đi giữa hai điểm này');
    }
}

function displayPath(result) {
    pathLayerGroup.clearLayers();

    const pathCoords = result.path_coordinates.map(p => [p.lat, p.lon]);

    const pathLine = L.polyline(pathCoords, {
        color: COLORS.path,
        weight: 5,
        opacity: 0.8
    }).addTo(pathLayerGroup);

    map.fitBounds(pathLine.getBounds(), { padding: [50, 50] });

    result.path_coordinates.forEach((point, index) => {
        if (index === 0 || index === result.path_coordinates.length - 1) {
            const marker = L.circleMarker([point.lat, point.lon], {
                radius: 6,
                fillColor: index === 0 ? COLORS.startMarker : COLORS.endMarker,
                color: '#fff',
                weight: 2,
                opacity: 1,
                fillOpacity: 1
            }).addTo(pathLayerGroup);

            marker.bindPopup('<strong>Node ' + point.node_id + '</strong><br>' + (index === 0 ? 'Bắt đầu' : 'Kết thúc'));
        }
    });
}

function displayResult(result) {
    document.getElementById('total-distance').textContent = result.total_distance.toFixed(2) + ' m';
    document.getElementById('num-nodes').textContent = result.num_nodes;
    document.getElementById('path-string').textContent = result.path_string;

    document.getElementById('graph-distance').textContent = result.graph_distance.toFixed(2) + ' m';
    document.getElementById('start-offset').textContent = result.start_offset.toFixed(2) + ' m';
    document.getElementById('end-offset').textContent = result.end_offset.toFixed(2) + ' m';

    document.getElementById('result').classList.remove('hidden');
}

document.getElementById('pick-start').addEventListener('click', () => {
    pickingMode = 'start';
    document.getElementById('pick-start').textContent = 'Nhấp vào bản đồ...';
});

document.getElementById('pick-end').addEventListener('click', () => {
    pickingMode = 'end';
    document.getElementById('pick-end').textContent = 'Nhấp vào bản đồ...';
});

document.getElementById('find-path').addEventListener('click', findPath);

initMap();
loadData();

setInterval(async () => {
    try {
        const constraintsRes = await fetch('/api/constraints');
        const newConstraints = await constraintsRes.json();

        if (JSON.stringify(newConstraints) !== JSON.stringify(constraints)) {
            constraints = newConstraints;
            drawEdges();
        }
    } catch (error) {
        console.error('Error polling constraints:', error);
    }
}, 2000);
