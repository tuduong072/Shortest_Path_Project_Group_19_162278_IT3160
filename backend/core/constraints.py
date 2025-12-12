import csv
import os
from typing import List, Dict, Optional

class ConstraintsManager:
    def __init__(self, csv_path: str):
        self.csv_path = csv_path
        self.constraints: Dict[int, Dict] = {}
        self.load_constraints()

    def load_constraints(self) -> List[Dict]:
        self.constraints.clear()

        if not os.path.exists(self.csv_path):
            os.makedirs(os.path.dirname(self.csv_path), exist_ok=True)
            self._create_empty_csv()
            return []

        try:
            with open(self.csv_path, 'r', encoding='utf-8') as f:
                reader = csv.DictReader(f)
                if reader.fieldnames is None:
                    return []

                for row in reader:
                    if row.get('edge_id'):
                        edge_id = int(row['edge_id'])
                        self.constraints[edge_id] = {
                            'edge_id': edge_id,
                            'constraint_type': row.get('constraint_type', ''),
                            'value': row.get('value', ''),
                            'description': row.get('description', '')
                        }
            return list(self.constraints.values())
        except Exception as e:
            print(f"Error loading constraints: {e}")
            return []

    def _create_empty_csv(self):
        try:
            with open(self.csv_path, 'w', newline='', encoding='utf-8') as f:
                writer = csv.DictWriter(f, fieldnames=['edge_id', 'constraint_type', 'value', 'description'])
                writer.writeheader()
        except Exception as e:
            print(f"Error creating constraints CSV: {e}")

    def _save_constraints(self):
        try:
            with open(self.csv_path, 'w', newline='', encoding='utf-8') as f:
                writer = csv.DictWriter(f, fieldnames=['edge_id', 'constraint_type', 'value', 'description'])
                writer.writeheader()
                for constraint in self.constraints.values():
                    writer.writerow(constraint)
        except Exception as e:
            print(f"Error saving constraints: {e}")

    def add_constraint(self, edge_id: int, constraint_type: str, value: str, description: str = "") -> bool:
        try:
            # Check for ONEWAY CONSTRAINT
            if constraint_type == 'oneway' and value =='both':
                # Chỉ cho phép áp dụng "both" nếu edge là một chiều gốc
                # Cần có thông tin về edges để kiểm tra
                # (Phần này cần được thêm từ bên ngoài hoặc tham chiếu đến edges_data)
                pass
            
            self.constraints[edge_id] = {
                'edge_id': edge_id,
                'constraint_type': constraint_type,
                'value': value,
                'description': description
            }
            self._save_constraints()
            return True
        except Exception as e:
            print(f"Error adding constraint: {e}")
            return False

    def add_constraints_batch(self, constraints: List[Dict]) -> bool:
        try:
            for constraint in constraints:
                self.add_constraint(
                    edge_id=constraint['edge_id'],
                    constraint_type=constraint['constraint_type'],
                    value=constraint['value'],
                    description=constraint.get('description', '')
                )
            self._save_constraints()
            return True
        except Exception as e:
            print(f"Error adding batch constraints: {e}")
            return False

    def remove_constraint(self, edge_id: int) -> bool:
        try:
            if edge_id in self.constraints:
                del self.constraints[edge_id]
                self._save_constraints()
            return True
        except Exception as e:
            print(f"Error removing constraint: {e}")
            return False

    def clear_all_constraints(self) -> bool:
        try:
            self.constraints.clear()
            self._save_constraints()
            return True
        except Exception as e:
            print(f"Error clearing constraints: {e}")
            return False

    def get_constraint_by_edge(self, edge_id: int) -> Optional[Dict]:
        return self.constraints.get(edge_id)

    def get_all_constraints(self) -> List[Dict]:
        return list(self.constraints.values())
