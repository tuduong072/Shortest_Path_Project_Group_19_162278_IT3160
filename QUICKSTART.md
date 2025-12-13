# 🚀 Quick Start - Hệ Thống Tìm Đường Ngắn Nhất

## ⏱️ **Thiết lập trong 5 phút**

### 📋 **Yêu cầu hệ thống**
- Python 3.8 trở lên
- Git (để clone repository)
- Trình duyệt web hiện đại

## 🛠️ **Cài đặt nhanh**

### **Bước 1: Clone repository**
```bash
git clone https://github.com/tuduong072/Shortest_Path_Project_Group_19_162278_IT3160.git
cd Shortest_Path_Project_Group_19_162278_IT3160
```

### **Bước 2: Cài đặt Python dependencies**
```bash
# Di chuyển vào thư mục backend
cd backend

# Cài đặt các thư viện cần thiết
pip install -r requirements.txt

# Nếu gặp lỗi permission, thử:
pip install --user -r requirements.txt
```

### **Bước 3: Chuẩn bị dữ liệu**
```bash
# Đảm bảo có thư mục data với các file CSV
# Cấu trúc thư mục:
# data/
#   ├── nodes.csv      # 949 nodes
#   └── edges.csv      # 2322 edges

# Nếu chưa có dữ liệu, tạo thư mục mẫu:
mkdir -p data
# Sao chép file CSV của bạn vào thư mục data/
```

### **Bước 4: Chạy ứng dụng**
```bash
# Chạy server Flask
python app.py

# Hoặc nếu có file run.sh (Linux/Mac)
./run.sh

# Hoặc run.bat (Windows)
run.bat
```

### **Bước 5: Truy cập ứng dụng**
Mở trình duyệt và truy cập:
- **Giao diện người dùng**: http://localhost:5000
- **Giao diện quản trị**: http://localhost:5000/admin

## 🧪 **Test nhanh ứng dụng**

### **Test 1: Tìm đường đơn giản**
1. Truy cập http://localhost:5000
2. Click **"Chọn trên bản đồ"** cho điểm bắt đầu
3. Click **"Chọn trên bản đồ"** cho điểm kết thúc  
4. Click **"Tìm Đường"**
5. Xem kết quả trên bản đồ và thông tin chi tiết

### **Test 2: Quản lý ràng buộc (Admin)**
1. Truy cập http://localhost:5000/admin
2. Click **"Vẽ Polygon"**
3. Vẽ một vùng trên bản đồ
4. Chọn loại ràng buộc (Block/Penalty/One-way)
5. Click **"Áp Dụng Ràng Buộc"**
6. Quay lại giao diện người dùng và test lại

## 📁 **Cấu trúc dữ liệu CSV**

### **nodes.csv (bắt buộc)**
```csv
node_id,latitude,longitude,name
1,20.962223,105.830595,Node 1
2,20.962500,105.831000,Node 2
```

### **edges.csv (bắt buộc)**
```csv
edge_id,from_node,to_node,distance,is_oneway,name
1,1,2,150.5,0,Đường ABC
2,2,3,200.0,1,Đường một chiều
```

## 🚨 **Xử lý sự cố nhanh**

### **Lỗi "Module not found"**
```bash
# Đảm bảo đã cài requirements.txt
pip install flask pandas numpy

# Kiểm tra Python version
python --version
```

### **Lỗi "CSV file not found"**
```bash
# Kiểm tra file tồn tại
ls data/
# Nên có: nodes.csv và edges.csv

# Kiểm tra đường dẫn
cat backend/app.py | grep "data/"
```

### **Lỗi port 5000 đang được sử dụng**
```bash
# Đổi port (ví dụ sang 5001)
python app.py --port 5001
# Truy cập: http://localhost:5001
```

### **Bản đồ không hiển thị**
- Kiểm tra kết nối internet (cần tải tile từ OpenStreetMap)
- Mở Developer Console (F12) xem lỗi
- Thử trình duyệt khác

## ⚡ **Lệnh nhanh một dòng**
```bash
# Cài đặt và chạy nhanh
git clone https://github.com/tuduong072/Shortest_Path_Project_Group_19_162278_IT3160.git && cd Shortest_Path_Project_Group_19_162278_IT3160/backend && pip install -r requirements.txt && python app.py
```

## 🔧 **Cấu hình nâng cao nhanh**

### **Thay đổi port**
```bash
python app.py --port 8080
```

### **Chạy với debug mode**
```bash
python app.py --debug
```

### **Sử dụng database khác**
```bash
# Sửa file .env hoặc config trong app.py
DATABASE_URL=sqlite:///path/to/your/database.db
```

## 📊 **Thuật toán hỗ trợ**

1. **Dijkstra** - Tìm đường ngắn nhất cổ điển
2. **A*** - Tối ưu với heuristic (khoảng cách Haversine)
3. **Real-time constraints** - Ràng buộc thời gian thực

## 🎯 **Mẹo sử dụng nhanh**

### **Tối ưu hiệu suất**
- Giới hạn tìm kiếm trong phạm vi hợp lý
- Sử dụng ràng buộc để giảm không gian tìm kiếm
- Cache kết quả cho các query phổ biến

### **Debug nhanh**
```bash
# Xem log server
tail -f backend/logs/app.log

# Kiểm tra API
curl http://localhost:5000/api/nodes
curl http://localhost:5000/api/edges
```

## 📞 **Hỗ trợ nhanh**

### **Kiểm tra nhanh hệ thống**
```bash
# Kiểm tra Python
python --version
python -c "import flask; print('Flask OK')"

# Kiểm tra file
ls -la data/*.csv

# Kiểm tra server
curl -I http://localhost:5000
```

### **Các lỗi thường gặp và fix nhanh**

| Lỗi | Nguyên nhân | Fix nhanh |
|-----|------------|-----------|
| `ImportError` | Thiếu thư viện | `pip install -r requirements.txt` |
| `FileNotFoundError` | Thiếu file CSV | Kiểm tra thư mục `data/` |
| `Address already in use` | Port bận | Đổi port: `--port 5001` |
| `Map not loading` | No internet | Kiểm tra mạng, thử refresh |

## ✅ **Kiểm tra hoàn tất**

Sau khi chạy thành công, bạn sẽ có:
- ✅ Web server chạy trên http://localhost:5000
- ✅ Bản đồ tương tác với OpenStreetMap
- ✅ Tìm đường với Dijkstra và A*
- ✅ Giao diện quản trị ràng buộc
- ✅ API RESTful cho tích hợp

---

**🎉 Chúc mừng! Bạn đã thiết lập thành công hệ thống tìm đường ngắn nhất!**

**Cần hỗ trợ thêm?**
- Xem file [README.md](README.md) để biết chi tiết đầy đủ
- Kiểm tra [SETUP.md](SETUP.md) để cấu hình nâng cao
- Mở Issue trên GitHub để báo lỗi/đề xuất tính năng
