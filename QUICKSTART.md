# Quick Start Guide

## 5-Minute Setup

### 1. Prerequisites
- Python 3.8+ installed
- Your CSV data files ready

### 2. Setup Database

The database schema is already created. You just need to have:


These are already configured in your `.env` file.

### 3. Prepare Your Data

Replace sample data in `data/` folder:

- `data/nodes.csv` - Your 949 nodes
- `data/edges.csv` - Your 2322 edges
- `data/constraints/constraints_edges.csv` - Optional initial constraints

### 4. Install & Import

\`\`\`bash
# Install dependencies
cd backend
pip install -r requirements.txt

# Import data
python import_data.py
\`\`\`

### 5. Run Application

**Linux/Mac:**
\`\`\`bash
./run.sh
\`\`\`

**Windows:**
\`\`\`bash
run.bat
\`\`\`

**Or manually:**
\`\`\`bash
python app.py
\`\`\`

### 6. Open Browser

- User Interface: http://localhost:5000
- Admin Panel: http://localhost:5000/admin

## That's It!

You now have:
- ✅ Full routing system with Dijkstra & A*
- ✅ Real-time constraint management
- ✅ Interactive map interface
- ✅ Admin panel for managing road constraints

## Quick Test

1. Go to http://localhost:5000
2. Click "Chọn trên bản đồ" for start point
3. Click "Chọn trên bản đồ" for end point
4. Click "Tìm Đường"
5. See the route on the map!

## Admin Quick Test

1. Go to http://localhost:5000/admin
2. Click "Vẽ Polygon"
3. Draw a shape on the map
4. See affected edges
5. Select "Block" constraint
6. Add description: "Test block"
7. Click "Áp Dụng Ràng Buộc"
8. Go back to user interface and try routing - blocked edges won't be used!

## Common Issues

**Can't import data?**
- Check your CSV file format
- Ensure nodes.csv is imported before edges.csv

**No path found?**
- Try points closer together
- Check for block constraints
- Verify graph connectivity

**Map not loading?**
- Check internet connection (needs OpenStreetMap tiles)
- Check browser console for errors

## Next Steps

- Read [README.md](README.md) for full documentation
- Read [SETUP.md](SETUP.md) for detailed setup guide
- Customize colors and styles in `frontend/static/css/style.css`
- Add more algorithms in `backend/core/algorithms.py`

## Data Format Reference

**nodes.csv:**
\`\`\`csv
node_id,latitude,longitude
1,20.962223,105.830595
\`\`\`

**edges.csv:**
\`\`\`csv
edge_id,from_node,to_node,distance,is_oneway
1,1,2,150.5,0
\`\`\`
- distance: in meters
- is_oneway: 0=bidirectional, 1=one-way

**constraints_edges.csv:**
\`\`\`csv
edge_id,constraint_type,value,description
10,block,1.0,Flooded area
15,penalty,1.5,Light traffic
20,oneway,forward,Temporary one-way
\`\`\`

## Support

Need help? Check:
1. Browser Developer Console (F12)
2. Terminal/Command Prompt output
3. Full documentation in README.md
