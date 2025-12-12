# Hệ Thống Tìm Đường - Phường Hoàng Liệt

Ứng dụng web tìm đường tối ưu cho phường Hoàng Liệt với khả năng quản lý ràng buộc đường đi (ngập lụt, tắc đường, một chiều) theo thời gian thực. Dữ liệu được lưu trữ local trong file CSV.

## Thành viên nhóm

- Dương Phương Tú MSSV: 202416381
- Nguyễn Anh Tú MSSV: 202400078
- Hồ Vương Long MSSV: 202416268
- Nguyễn Minh Quân MSSV: 20235200
- Trần Khánh Linh MSSV: 20235137

## Tính Năng

### Người Dùng
- Tìm đường tối ưu giữa 2 điểm bất kỳ
- Hỗ trợ 2 thuật toán: Dijkstra và A*
- Nhập tọa độ hoặc chọn điểm trực tiếp trên bản đồ
- Hiển thị kết quả chi tiết:
  - Tổng khoảng cách (bao gồm khoảng cách từ điểm chọn đến node gần nhất)
  - Số lượng node đi qua
  - Đường đi chi tiết (node → node → node...)
- Xem trạng thái đường trên bản đồ theo màu sắc
- Thông tin chi tiết khi hover/click vào đường

### Admin
- Quản lý ràng buộc đường đi theo vùng
- 3 cách chọn vùng:
  - **Polygon**: Vẽ đa giác tự do
  - **Hình tròn**: Nhập tâm, bán kính, hoặc chọn tâm trực tiếp trên bản đồ
  - **Hình chữ nhật**: Vẽ hình chữ nhật
- Chọn cạnh riêng lẻ trực tiếp trên bản đồ
- 3 loại ràng buộc:
  - **Block**: Chặn hoàn toàn (không đi qua)
  - **Penalty**: Thêm hệ số phạt (tăng chi phí)
  - **Oneway**: Thay đổi hướng đi (forward/backward/both)
- Cập nhật theo thời gian thực (polling 2 giây)
- Xem danh sách cạnh bị ảnh hưởng
- Xóa ràng buộc riêng lẻ hoặc xóa tất cả
- Hover trên cạnh/node để xem thông tin chi tiết

## Cấu Trúc Dự Án

\`\`\`
project/
├── backend/                       # Flask backend
│   ├── app.py                    # Server chính
│   ├── run.sh / run.bat         # Startup scripts
│   ├── requirements.txt          # Python dependencies
│   └── core/
│       ├── graph.py              # RoadGraph + Haversine
│       ├── algorithms.py         # Dijkstra & A*
│       └── constraints.py        # CSV-based constraints
│
├── frontend/                      # Web interface
│   ├── templates/
│   │   ├── index.html           # Giao diện người dùng
│   │   └── admin.html           # Giao diện admin
│   └── static/
│       ├── css/style.css        # Styling
│       └── js/
│           ├── map.js           # User interface logic
│           └── admin.js         # Admin interface logic
│
├── data/                          # CSV data files
│   ├── nodes.csv                # 949 nodes
│   ├── edges.csv                # 2322 edges
│   └── constraints/
│       └── constraints_edges.csv # Constraints (auto-created)
│
├── Documentation
│   ├── README.md                 # Main documentation
│   ├── QUICKSTART.md            # 5-minute setup
│   ├── SETUP.md                 # Detailed setup
│   └── ARCHITECTURE.md          # System architecture
│
└── .env                          # Config (optional)
\`\`\`

## Cài Đặt

### 1. Chuẩn Bị Dữ Liệu

Thay thế dữ liệu mẫu trong thư mục \`data/\` bằng dữ liệu thực:

**data/nodes.csv**:
\`\`\`csv
node_id,latitude,longitude
1,20.962223,105.830595
2,20.961500,105.831000
...
\`\`\`
- 949 nodes cho phường Hoàng Liệt

**data/edges.csv**:
\`\`\`csv
edge_id,from_node,to_node,distance,is_oneway
1,1,2,150.5,0
2,2,3,200.0,1
...
\`\`\`
- 2322 edges tổng cộng
- \`is_oneway\`: 0 = hai chiều, 1 = một chiều (from_node → to_node)
- \`distance\`: tính bằng mét

**data/constraints/constraints_edges.csv** (tự tạo):
\`\`\`csv
edge_id,constraint_type,value,description
10,block,1.0,Cấm do ngập nặng
15,penalty,1.5,Ngập 30cm
20,oneway,forward,Chuyển 1 chiều
\`\`\`
- Tạo tự động trống nếu không có ràng buộc ban đầu

### 2. Cài Đặt Backend

\`\`\`bash
cd backend
pip install -r requirements.txt
\`\`\`

**Python 3.8+ yêu cầu**

### 3. Chạy Ứng Dụng

**Linux/Mac:**
\`\`\`bash
cd backend
./run.sh
\`\`\`

**Windows:**
\`\`\`bash
cd backend
run.bat
\`\`\`

**Hoặc chạy trực tiếp:**
\`\`\`bash
cd backend
python app.py
\`\`\`

Mở trình duyệt:
- Người dùng: http://localhost:5000
- Admin: http://localhost:5000/admin

## Sử Dụng

### Người Dùng

1. Truy cập http://localhost:5000
2. Chọn điểm bắt đầu:
   - Nhập tọa độ (vĩ độ, kinh độ)
   - Hoặc click "Chọn trên bản đồ"
3. Chọn điểm kết thúc tương tự
4. Chọn thuật toán (Dijkstra hoặc A*)
5. Click "Tìm Đường"
6. Xem kết quả và đường đi trên bản đồ

### Admin

1. Truy cập http://localhost:5000/admin
2. Chọn cách chọn vùng:
   - **Polygon**: Click "Vẽ Polygon" → Click nhiều điểm trên bản đồ → Click điểm đầu để đóng
   - **Hình tròn**: Nhập tâm (lat, lon) và bán kính → Click "Áp Dụng"
   - **Hình chữ nhật**: Click "Vẽ Hình Chữ Nhật" → Kéo trên bản đồ
3. Xem danh sách cạnh bị ảnh hưởng
4. Chọn loại ràng buộc:
   - **Block**: Chặn hoàn toàn
   - **Penalty**: Nhập hệ số phạt (>= 1.0)
   - **Oneway**: Chọn hướng
5. Nhập mô tả (tùy chọn)
6. Click "Áp Dụng Ràng Buộc"
7. Bản đồ cập nhật ngay lập tức

## Màu Sắc Đường

- 🔴 **Đỏ (#E6194B)**: Block - Chặn hoàn toàn
- 🟠 **Cam (#FF9900)**: Penalty - Ngập nước
- 🟡 **Vàng (#FFCC00)**: Penalty - Tắc đường
- 🔵 **Xanh dương (#0082C8)**: Oneway - Một chiều
- ⚫ **Xám (#666666)**: Normal - Đường bình thường
- 🟢 **Xanh lá (#00D084)**: Đường đi tìm được

## API Endpoints

### Public
- \`GET /\` - Trang người dùng
- \`GET /admin\` - Trang admin
- \`GET /api/nodes\` - Lấy danh sách nodes
- \`GET /api/edges\` - Lấy danh sách edges
- \`GET /api/constraints\` - Lấy danh sách ràng buộc

### Pathfinding
- \`POST /api/find-nearest\` - Tìm node gần nhất
- \`POST /api/find-path\` - Tìm đường đi

### Admin
- \`POST /api/edges-in-polygon\` - Tìm cạnh trong polygon
- \`POST /api/edges-in-circle\` - Tìm cạnh trong hình tròn
- \`POST /api/add-constraints\` - Thêm ràng buộc
- \`DELETE /api/remove-constraint/<edge_id>\` - Xóa ràng buộc
- \`POST /api/clear-constraints\` - Xóa tất cả ràng buộc
- \`POST /api/reload-graph\` - Tải lại đồ thị

## Công Nghệ

### Backend
- **Flask**: Web framework
- **Python**: Core algorithms

### Frontend
- **Leaflet**: Interactive maps
- **Leaflet.Draw**: Drawing tools
- **Vanilla JS**: No heavy frameworks

### Algorithms
- **Dijkstra**: Tìm đường ngắn nhất cổ điển
- **A\***: Tìm đường với heuristic (Haversine distance)
- **Haversine**: Tính khoảng cách địa lý

## Thông Số

- **Số nodes**: 949
- **Số edges**: 2322
- **Đường một chiều gốc**: 124
- **Đường hai chiều gốc**: 2198
- **Tần suất polling**: 2 giây
- **Map center**: 20.962223, 105.830595

## Lưu Ý

- Ràng buộc cập nhật theo thời gian thực cho tất cả người dùng
- Khoảng cách tính bằng mét
- Thuật toán xử lý ràng buộc trong quá trình tìm đường
- Block edges không thể đi qua
- Penalty edges có chi phí tăng theo hệ số
- Oneway constraints kiểm soát hướng đi

## Troubleshooting

### Không tìm thấy đường đi
- Kiểm tra có block edges chặn đường không
- Thử thuật toán khác
- Kiểm tra hai điểm có trong cùng vùng connected không

### Bản đồ không hiển thị
- Kiểm tra kết nối internet (cần load OpenStreetMap tiles)
- Kiểm tra console browser có lỗi không

### Import dữ liệu lỗi
- Kiểm tra format CSV đúng chưa
- Kiểm tra foreign key constraints (nodes phải import trước edges)
