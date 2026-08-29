# Ghi chú chuyển đổi kiểm kê sang Chỉ số cây

- File mẫu `mau-import-plotIndicators.xlsx` có sheet **Chỉ số cây định kỳ** gồm 2 dòng tiêu đề/mẫu và 12 cột, cùng sheet **Hướng dẫn**.
- File nguồn `THCHUNGKIỂMKÊCSKD-CPC.xlsx` có sheet chi tiết **Chi tiết KK CSKD tại Campuchia** gồm 245 dòng, 33 cột; sheet **TH CHUNG** là bảng tổng hợp, không dùng để tạo các dòng import theo lô.
- File đầu ra sẽ dùng ngày cập nhật cố định **22/8/2026** và chỉ chuyển các trường có nguồn theo từng lô; không tự tạo giá trị khi nguồn thiếu.

Kết quả chuyển đổi gồm 208 dòng kiểm kê, khớp 208 mã lô duy nhất trong hệ thống và không có dòng lỗi. Workbook `import_chi_so_cay_kiem_ke_2026-08-22.xlsx` có sheet **Chỉ số cây định kỳ** gồm 12 cột import, sheet **Đối chiếu nguồn** để kiểm tra từng lô, và sheet **Hướng dẫn**. Toàn bộ 208 dòng có ngày cập nhật `2026-08-22`.

Sau xác nhận của người dùng, dữ liệu chỉ số cây cũ của 208 lô đã được ghi đè bằng file kiểm kê. Đối chiếu độc lập sau nhập: 878.401 hố kiểm kê, 766.372 cây kiểm kê, 706.339 cây cạo, 9.127 cây chưa đủ tiêu chuẩn, 8.864 cây không hiệu quả, 680 cây bệnh không cạo, 41.362 cây khô miệng cạo và 112.029 hố trống. Tất cả 208 lô có ngày chỉ số `2026-08-22`.
