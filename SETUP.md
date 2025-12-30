# Hướng Dẫn Cài Đặt Chi Tiết

## Yêu Cầu Hệ Thống

- Python 3.8 trở lên
- pip (Python package manager)
- Dữ liệu CSV (nodes.csv, edges.csv)


## Bước 1: Chuẩn Bị Dữ Liệu CSV

### 1.1. Tạo thư mục dữ liệu

```bash
mkdir -p data/constraints
```

### 1.2. Chuẩn Bị Dữ liệu

Thay thế dữ liệu mẫu trong thư mục `data/` bằng dữ liệu thực của bạn:

**data/nodes.csv** (1433 nodes):
```csv
node_id,latitude,longitude
1,20.962223,105.830595
2,20.962000,105.831000
...
```

**data/edges.csv** (1873 edges):
```csv
edge_id,from_node,to_node,distance,is_oneway
1,1,2,150.5,0
2,2,3,200.0,1
...
```

**Định dạng:**
- `node_id`: Số nguyên duy nhất
- `latitude`, `longitude`: Tọa độ GPS (decimal)
- `edge_id`: Số nguyên duy nhất
- `from_node`, `to_node`: ID của node bắt đầu và kết thúc
- `distance`: Khoảng cách tính bằng mét
- `is_oneway`: 0 = hai chiều, 1 = một chiều (from_node → to_node)

**constraints/constraints_edges.csv** (tự tạo):
```csv
edge_id,constraint_type,value,description
10,block,1.0,Cấm do ngập nặng
15,penalty,1.5,Ngập 30cm
20,oneway,forward,Chuyển 1 chiều
```

File này sẽ được tự động tạo nếu chưa có.

## Bước 2: Cài Đặt Dependencies

### 2.1. Backend (Python)

```bash
cd backend
pip install -r requirements.txt
```

Hoặc với pip3:
```bash
pip3 install -r requirements.txt
```

### 2.2. Kiểm Tra Installation

```bash
python -c "import flask; print('OK')"
```

Nếu thấy "OK" → Cài đặt thành công

## Bước 3: Chạy Ứng Dụng

### 3.1. Linux/Mac

```bash
cd backend
./run.sh
```

Script sẽ:
1. Kiểm tra Python
2. Cài đặt dependencies
3. Kiểm tra CSV files
4. Khởi động Flask server

### 3.2. Windows

```bash
cd backend
run.bat
```

### 3.3. Chạy Thủ Công

```bash
cd backend
python app.py
```

## Bước 4: Truy Cập Ứng Dụng

Mở trình duyệt:

- **Giao diện người dùng:** http://localhost:5000
- **Admin panel:** http://localhost:5000/admin

## Troubleshooting

### Lỗi: "ModuleNotFoundError: No module named 'flask'"

**Nguyên nhân:** Dependencies chưa được cài đặt

**Giải pháp:**
```bash
pip install -r requirements.txt
```

### Lỗi: "FileNotFoundError: nodes.csv not found"

**Nguyên nhân:** Dữ liệu CSV chưa được đặt đúng vị trí

**Giải pháp:**
1. Kiểm tra file nằm trong `data/nodes.csv`
2. Kiểm tra tên file đúng (phải là `nodes.csv`)
3. Kiểm tra file không phải là Excel, phải là CSV

### Lỗi: "No path found"

**Nguyên nhân:** Hai điểm không kết nối hoặc bị block constraints

**Giải pháp:**
1. Chọn 2 điểm gần nhau hơn
2. Kiểm tra block constraints
3. Thử thuật toán khác

### Bản đồ không hiển thị

**Nguyên nhân:** Không tải được OpenStreetMap tiles

**Giải pháp:**
1. Kiểm tra kết nối internet
2. Mở Developer Console (F12) xem lỗi
3. Refresh page

### Ràng buộc không cập nhật

**Nguyên nhân:** Polling interval 2 giây có thể chậm

**Giải pháp:**
1. Refresh page
2. Click "Làm Mới Bản Đồ" trong admin
3. Kiểm tra constraints CSV file

## Performance Tips

### Tối ưu hóa tốc độ

1. **Giảm số lượng constraints:** Xóa constraint cũ không dùng
2. **Giảm polling interval:** Edit `setInterval(2000)` thành `setInterval(1000)` trong JS
3. **Tăng máy chủ:** Nếu có 100+ users, sử dụng gunicorn

### Caching

Backend cache dữ liệu graph trong memory. Khi thêm constraint, graph được reload tự động.

## Security Notes

1. **CSV Files:** Chứa dữ liệu công khai (nodes, edges, constraints)
2. **Admin Access:** Hiện tại open cho mọi người - cân nhắc thêm authentication
3. **API Keys:** Không cần - không sử dụng dịch vụ ngoài

## Development

### Thay đổi Map Center

File: `frontend/static/js/map.js` (dòng 1)
```javascript
const MAP_CENTER = [20.962223, 105.830595];
```

### Thay đổi Colors

File: `frontend/static/js/map.js` (dòng 4-11)
```javascript
const COLORS = {
    block: '#E6194B',
    penalty_flood: '#FF9900',
    // ...
};
```

### Thêm Thuật Toán Mới

1. Thêm function trong `backend/core/algorithms.py`
2. Thêm endpoint trong `backend/app.py`
3. Thêm option trong `frontend/templates/index.html`
4. Update JavaScript để call API mới

## Production Deployment

### Option 1: Gunicorn (Recommended)

```bash
pip install gunicorn
cd backend
gunicorn -w 4 -b 0.0.0.0:5000 app:app
```

### Option 2: Docker

```dockerfile
FROM python:3.10
WORKDIR /app
COPY backend/requirements.txt .
RUN pip install -r requirements.txt
COPY . .
EXPOSE 5000
CMD ["python", "backend/app.py"]
```

```bash
docker build -t routing-system .
docker run -p 5000:5000 routing-system
```

### Option 3: Cloud Platforms

- Heroku
- Railway
- Render
- DigitalOcean

Tất cả hỗ trợ Python apps

## Backup & Restore

### Backup Ràng buộc

CSV file `data/constraints/constraints_edges.csv` tự động lưu mỗi khi thay đổi.

Backup thủ công:
```bash
cp data/constraints/constraints_edges.csv data/constraints/constraints_edges.csv.backup
```

### Restore Ràng buộc

```bash
cp data/constraints/constraints_edges.csv.backup data/constraints/constraints_edges.csv
```

Sau đó reload app hoặc refresh admin page.

## Support

Nếu gặp vấn đề:
1. Kiểm tra logs trong terminal
2. Mở Developer Console (F12) xem lỗi browser
3. Xem full documentation trong README.md
4. Xem architecture trong ARCHITECTURE.md
