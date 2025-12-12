const MAP_CENTER = [20.962223, 105.830595];
const ZOOM_LEVEL = 15;

const COLORS = {
    block: '#DC2626',
    penalty_flood: '#EA580C',
    penalty_traffic: '#F59E0B',
    oneway: '#0051ffff',
    normal: '#6B7280',
    oneway_original: '#7C3AED',
    selected: '#ff00c3ff'
};

let map;
let nodes = [];
let edges = [];
let constraints = [];
let edgeLayerGroup;
let drawControl;
let drawnItems;
let selectedEdges = [];
let currentShape = null;
let pickingCircleCenter = false;

function initMap() {
    map = L.map('map').setView(MAP_CENTER, ZOOM_LEVEL);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
    }).addTo(map);

    edgeLayerGroup = L.layerGroup().addTo(map);
    drawnItems = new L.FeatureGroup().addTo(map);

    map.on('click', handleMapClickAdmin);

    drawControl = new L.Control.Draw({
        position: 'topright',
        draw: {
            polygon: false,
            polyline: false,
            rectangle: false,
            circle: false,
            marker: false,
            circlemarker: false
        },
        edit: {
            featureGroup: drawnItems,
            remove: true
        }
    });

    map.addControl(drawControl);

    map.on(L.Draw.Event.CREATED, function (event) {
        const layer = event.layer;
        drawnItems.clearLayers();
        drawnItems.addLayer(layer);
        currentShape = layer;

        if (event.layerType === 'polygon' || event.layerType === 'rectangle') {
            const latlngs = layer.getLatLngs()[0];
            const polygon = latlngs.map(ll => [ll.lat, ll.lng]);
            findEdgesInPolygon(polygon);
        }
    });

    map.on(L.Draw.Event.DELETED, function () {
        currentShape = null;
        selectedEdges = [];
        hideSelectedEdges();
    });
}

function handleMapClickAdmin(e) {
    if (pickingCircleCenter) {
        document.getElementById('circle-lat').value = e.latlng.lat.toFixed(6);
        document.getElementById('circle-lon').value = e.latlng.lng.toFixed(6);
        pickingCircleCenter = false;
        document.getElementById('pick-circle-center').textContent = 'Chọn tâm trên bản đồ';
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
        showStatus('Lỗi khi tải dữ liệu', 'error');
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
    // ƯU TIÊN CAO NHẤT: Trạng thái đặc biệt (selected)
    if (selectedEdges.includes(edgeId)) {
        return COLORS.selected; // #ff00c3ff - Hồng
    }
    
    const edge = edges.find(e => e.edge_id === edgeId);
    const constraint = constraints.find(c => c.edge_id === edgeId);

    // THỨ TỰ ƯU TIÊN CHÍNH:
    // 1. CẤM ĐI (block) - CAO NHẤT
    if (constraint && constraint.constraint_type === 'block') {
        return COLORS.block; // #DC2626 - Đỏ
    }

    // 2. PHẠT (penalty) - TRUNG BÌNH
    if (constraint && constraint.constraint_type === 'penalty') {
        if (constraint.description.toLowerCase().includes('ngập')) {
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
            const isSelected = selectedEdges.includes(edge.edge_id);
            const color = getEdgeColor(edge.edge_id);
            const constraint = constraints.find(c => c.edge_id === edge.edge_id);
            const edgeDisplayName = getEdgeDisplayName(edge, constraint);

            const line = L.polyline(
                [[fromNode.latitude, fromNode.longitude], [toNode.latitude, toNode.longitude]],
                {
                    color: color,
                    weight: isSelected ? 4 : 3,
                    opacity: isSelected ? 0.8 : 0.6
                }
            ).addTo(edgeLayerGroup);

            let popupContent = '<strong>Edge ' + edge.edge_id + '</strong><br>';
            popupContent += edgeDisplayName + '<br>';
            popupContent += 'Khoảng cách: ' + edge.distance.toFixed(1) + 'm<br>';
            popupContent += 'Loại: ' + (edge.is_oneway === 1 ? 'Một chiều' : 'Hai chiều');

            if (constraint) {
                popupContent += '<br><strong>Ràng buộc:</strong> ' + constraint.constraint_type;
                
                // THÊM: Hiển thị value cho oneway
                if (constraint.constraint_type === 'oneway') {
                    if (constraint.value === 'both') {
                        popupContent += ' (hai chiều)'; // THAY ĐỔI: Hiển thị dễ hiểu
                    } else if (constraint.value === 'forward') {
                        popupContent += ' (một chiều thuận)';
                    } else if (constraint.value === 'backward') {
                        popupContent += ' (một chiều nghịch)';
                    }
                }
                
                if (constraint.description) {
                    popupContent += '<br>' + constraint.description;
                }
                popupContent += '<br><button class="constraint-btn" onclick="removeConstraint(' + edge.edge_id + ')">Xóa ràng buộc</button>';
            } else if (isSelected) {
                popupContent += '<br><button class="constraint-btn" onclick="deselectEdge(' + edge.edge_id + ')">Bỏ chọn</button>';
            } else {
                popupContent += '<br><button class="constraint-btn" onclick="selectEdge(' + edge.edge_id + ')">Chọn cạnh</button>';
            }

            line.bindPopup(popupContent);

            line.on('click', function() {
                this.openPopup();
            });

            line.on('mouseover', function() {
                this.setStyle({ weight: 5, opacity: 1 });
            });

            line.on('mouseout', function() {
                this.setStyle({ 
                    weight: isSelected ? 4 : 3,
                    opacity: isSelected ? 0.8 : 0.6
                });
            });
        }
    });

    nodes.forEach(node => {
        const marker = L.circleMarker([node.latitude, node.longitude], {
            radius: 2,
            fillColor: '#333',
            color: '#fff',
            weight: 0.5,
            opacity: 1,
            fillOpacity: 0.4
        }).addTo(edgeLayerGroup);

        marker.bindPopup('<strong>Node ' + node.node_id + '</strong>');

        marker.on('mouseover', function() {
            this.setStyle({ radius: 4, fillOpacity: 0.8 });
        });

        marker.on('mouseout', function() {
            this.setStyle({ radius: 2, fillOpacity: 0.4 });
        });
    });
}

function selectEdge(edgeId) {
    if (!selectedEdges.includes(edgeId)) {
        selectedEdges.push(edgeId);
        drawEdges();
        showSelectedEdges();
        showStatus('Đã chọn cạnh ' + edgeId, 'success');
    }
}

function deselectEdge(edgeId) {
    selectedEdges = selectedEdges.filter(id => id !== edgeId);
    drawEdges();
    showSelectedEdges();
    showStatus('Bỏ chọn cạnh ' + edgeId, 'success');
}

async function removeConstraint(edgeId) {
    if (!confirm('Xóa ràng buộc cho cạnh ' + edgeId + '?')) {
        return;
    }

    try {
        const response = await fetch('/api/remove-constraint/' + edgeId, {
            method: 'DELETE'
        });

        if (response.ok) {
            showStatus('Đã xóa ràng buộc cho cạnh ' + edgeId, 'success');
            await loadData();
        } else {
            showStatus('Lỗi khi xóa ràng buộc', 'error');
        }
    } catch (error) {
        console.error('Error removing constraint:', error);
        showStatus('Lỗi khi xóa ràng buộc', 'error');
    }
}

async function findEdgesInPolygon(polygon) {
    try {
        const response = await fetch('/api/edges-in-polygon', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ polygon })
        });

        const result = await response.json();

        result.edges.forEach(edge => {
            if (!selectedEdges.includes(edge.edge_id)) {
                selectedEdges.push(edge.edge_id);
            }
        });

        showSelectedEdges();
        drawEdges();
    } catch (error) {
        console.error('Error finding edges:', error);
        showStatus('Lỗi khi tìm cạnh', 'error');
    }
}

async function findEdgesInCircle() {
    const lat = parseFloat(document.getElementById('circle-lat').value);
    const lon = parseFloat(document.getElementById('circle-lon').value);
    const radius = parseFloat(document.getElementById('circle-radius').value);

    if (isNaN(lat) || isNaN(lon) || isNaN(radius)) {
        showStatus('Vui lòng nhập đầy đủ thông tin', 'error');
        return;
    }

    try {
        const response = await fetch('/api/edges-in-circle', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                center_lat: lat,
                center_lon: lon,
                radius: radius
            })
        });

        const result = await response.json();
        selectedEdges = [];
        result.edges.forEach(edge => {
            selectedEdges.push(edge.edge_id);
        });

        drawnItems.clearLayers();
        const circle = L.circle([lat, lon], {
            radius: radius,
            color: COLORS.selected,
            fillOpacity: 0.2
        }).addTo(drawnItems);
        currentShape = circle;

        showSelectedEdges();
        drawEdges();
    } catch (error) {
        console.error('Error finding edges:', error);
        showStatus('Lỗi khi tìm cạnh', 'error');
    }
}

function showSelectedEdges() {
    const edgeCount = selectedEdges.length;
    document.getElementById('edges-count').textContent = edgeCount;

    const edgesList = document.getElementById('edges-list');
    edgesList.innerHTML = '';

     selectedEdges.forEach(edgeId => {
        const edge = edges.find(e => e.edge_id === edgeId);
        const constraint = constraints.find(c => c.edge_id === edgeId);

        if (edge) {
            const edgeItem = document.createElement('div');
            edgeItem.className = 'edge-item';

            const edgeDisplayName = getEdgeDisplayName(edge, constraint);
            edgeItem.innerHTML = 'Edge ' + edge.edge_id + ': ' + edgeDisplayName;

            edgesList.appendChild(edgeItem);
        }
    });

    document.getElementById('constraint-config').classList.remove('hidden');
}

function hideSelectedEdges() {
    selectedEdges = [];
    document.getElementById('constraint-config').classList.add('hidden');
    drawEdges();
}

async function applyConstraints() {
    if (selectedEdges.length === 0) {
        showStatus('Vui lòng chọn cạnh trước', 'error');
        return;
    }

    const constraintType = document.getElementById('constraint-type').value;
    let value = '1.0';

    if (constraintType === 'penalty') {
        value = document.getElementById('penalty-value').value;
    } else if (constraintType === 'oneway') {
        value = document.getElementById('oneway-direction').value;
    
        // THÊM: Validation cho "both" constraint
        if (value === 'both') {
            // Kiểm tra tất cả selected edges có phải là đường một chiều gốc không
            const invalidEdges = [];
            selectedEdges.forEach(edgeId => {
                const edge = edges.find(e => e.edge_id === edgeId);
                if (edge && edge.is_oneway === 0) {
                    invalidEdges.push(edge.edge_id);
                }
            });
                
            if (invalidEdges.length > 0) {
                showStatus(
                    `Lỗi: "Hai chiều" chỉ áp dụng cho đường một chiều gốc. ` +
                    `Các edge sau là hai chiều: ${invalidEdges.join(', ')}`, 
                    'error'
                );
                return;
            }
        }
    }

    const description = document.getElementById('constraint-description').value;

    try {
        const response = await fetch('/api/add-constraints', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                edge_ids: selectedEdges,
                constraint_type: constraintType,
                value: value,
                description: description
            })
        });

        if (response.ok) {
            showStatus('Đã áp dụng ràng buộc thành công', 'success');
            await loadData();
            drawnItems.clearLayers();
            selectedEdges = [];
            hideSelectedEdges();
        } else {
            showStatus('Lỗi khi áp dụng ràng buộc', 'error');
        }
    } catch (error) {
        console.error('Error applying constraints:', error);
        showStatus('Lỗi khi áp dụng ràng buộc', 'error');
    }
}

async function clearAllConstraints() {
    if (!confirm('Bạn có chắc chắn muốn xóa tất cả ràng buộc?')) {
        return;
    }

    try {
        const response = await fetch('/api/clear-constraints', {
            method: 'POST'
        });

        if (response.ok) {
            showStatus('Đã xóa tất cả ràng buộc', 'success');
            await loadData();
        } else {
            showStatus('Lỗi khi xóa ràng buộc', 'error');
        }
    } catch (error) {
        console.error('Error clearing constraints:', error);
        showStatus('Lỗi khi xóa ràng buộc', 'error');
    }
}

function showStatus(message, type) {
    const statusEl = document.getElementById('status');
    const messageEl = document.getElementById('status-message');

    messageEl.textContent = message;
    statusEl.className = 'status';
    if (type === 'error') {
        statusEl.classList.add('error');
    }
    statusEl.classList.remove('hidden');

    setTimeout(() => {
        statusEl.classList.add('hidden');
    }, 3000);
}

document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        const tab = btn.dataset.tab;

        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));

        btn.classList.add('active');
        document.getElementById(tab + '-tab').classList.add('active');

        drawnItems.clearLayers();
        selectedEdges = [];
        hideSelectedEdges();
    });
});

document.getElementById('draw-polygon').addEventListener('click', () => {
    new L.Draw.Polygon(map, drawControl.options.polygon).enable();
});

document.getElementById('draw-rectangle').addEventListener('click', () => {
    new L.Draw.Rectangle(map, drawControl.options.rectangle).enable();
});

document.getElementById('pick-circle-center').addEventListener('click', () => {
    pickingCircleCenter = true;
    document.getElementById('pick-circle-center').textContent = 'Nhấp vào bản đồ...';
});

document.getElementById('apply-circle').addEventListener('click', findEdgesInCircle);

document.getElementById('constraint-type').addEventListener('change', (e) => {
    const type = e.target.value;

    document.getElementById('penalty-config').classList.add('hidden');
    document.getElementById('oneway-config').classList.add('hidden');

    if (type === 'penalty') {
        document.getElementById('penalty-config').classList.remove('hidden');
    } else if (type === 'oneway') {
        document.getElementById('oneway-config').classList.remove('hidden');
    }
});

document.getElementById('apply-constraints').addEventListener('click', applyConstraints);
document.getElementById('clear-constraints').addEventListener('click', clearAllConstraints);
document.getElementById('refresh-map').addEventListener('click', loadData);

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
