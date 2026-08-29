# Đối chiếu dữ liệu Excel nguồn

Ngày kiểm kê: 2026-08-22 (GMT+7)

| Tệp nguồn | Bản ghi hợp lệ | Nội dung chính | Kiểm tra dữ liệu |
|---|---:|---|---|
| `import-Vuoncay,lo.xlsx` | 208 | Đơn vị, tên lô, năm trồng, giống, diện tích và chỉ tiêu vườn cây | 6 đơn vị, 1.582,69 ha; không trùng khóa đơn vị–lô–năm |
| `import_nhancong.xlsx` | 335 | Đội, tên, phiên âm, giới tính, trạng thái | 6 đơn vị; toàn bộ đang làm việc |
| `import_nhap_mu.xlsx` | 108 | Đợt, ngày, đội, vườn, mủ đông/tạp, mủ dây | Không trùng; cộng nhập đối chiếu đúng; tổng 638.790 kg |
| `import_xuat_mu.xlsx` | 30 | Đợt, ngày, đội, mủ đông/tạp, mủ dây | Không trùng; cộng xuất đối chiếu đúng; tổng 516.677 kg |

## Quy tắc lưu trữ

Sổ vườn/lô được lưu như các lô quản lý với mã tạo từ đơn vị, năm trồng và tên lô để giữ tính duy nhất. Các chỉ tiêu trồng, kiểm kê và xếp hạng được bảo toàn trong dữ liệu lô.

Dữ liệu nhập mủ và xuất mủ nguồn được ghi nhận **theo đội**, vì tệp xuất không có cột vườn và cùng một ngày có nhiều đội. Do đó chúng được lưu ở bảng dữ liệu đội chuyên biệt, tách khỏi bản ghi thủ công theo lô của ứng dụng. Cách này giữ nguyên số liệu nguồn, tránh gán sai sản lượng cho một lô cụ thể và phục vụ import/export theo đúng biểu mẫu.

## Chuẩn tệp import

| Loại dữ liệu | Cột bắt buộc |
|---|---|
| Vườn/lô | Đơn vị, Tên lô, Diện tích (ha) |
| Nhân công | Đội, Tên |
| Nhập mủ theo đội | Đợt, Ngày, Đội, Mủ đông/tạp (kg), Mủ dây (kg) |
| Xuất mủ theo đội | Đợt, Ngày, Đội, Mủ đông/tạp (kg), Mủ dây (kg) |

Giá trị tổng được hệ thống tính lại từ hai cột khối lượng thành phần thay vì tin cậy cột tổng trong tệp nguồn.
