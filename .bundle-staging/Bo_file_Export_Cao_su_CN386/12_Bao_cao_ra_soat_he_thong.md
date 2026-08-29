# Rà soát hệ thống — 23/08/2026

## Tính toàn vẹn dữ liệu

Kiểm tra 15 nhóm lỗi tham chiếu, trùng khóa và dữ liệu âm cho lô, nhập/xuất mủ, chăm sóc, phân công và tài khoản nội bộ cho kết quả **0 lỗi**. Dữ liệu hiện có gồm 208 lô, 335 nhân công, 108 dòng nhập mủ theo Đội, 30 dòng xuất mủ theo Đội và 24 bản ghi theo dõi hằng ngày. Chưa có phân công nhân công theo lô; đây là trạng thái dữ liệu chưa nhập, không phải lỗi.

## Tương thích import/export đã khắc phục

Trình nhập Nhân công hiện chấp nhận cả tiêu đề `Trạng thái` và `Trạng thái làm việc`. Trình nhập Vườn/lô ưu tiên `Mã lô` và `Tên lô` nguồn, đồng thời chấp nhận cả `Xếp hạng` và `Xếp hạng vườn cây`; nhờ đó file xuất có thể tái nhập mà không tự tạo mã lô khác. Bộ export toàn hệ thống đã có sheet phân chia nhân công vườn cây, trong khi import kiểm tra điều kiện Từ hàng không lớn hơn Đến hàng trước khi ghi dữ liệu.

## An toàn đã khắc phục

Router thao tác hằng ngày hiện yêu cầu quyền `care:read` và tự áp dụng phạm vi Đội. Các phụ thuộc tRPC, SheetJS, AWS SDK, Axios, Drizzle ORM, Nanoid và Express đã được nâng bản vá; Express 5 cũng đã được điều chỉnh tuyến proxy lưu trữ theo cú pháp mới. Kết quả `pnpm audit --prod` sau cùng không còn advisory cho dependency production. Bản build tiếp tục có cảnh báo kích thước chunk lớn, nhưng không phải lỗi bảo mật hoặc lỗi chạy ứng dụng.

## Nguồn tham khảo phụ thuộc

- [SheetJS NodeJS installation](https://docs.sheetjs.com/docs/getting-started/installation/nodejs/)
- [SheetJS CDN](https://cdn.sheetjs.com/)
- [tRPC security advisory GHSA-43p4-m455-4f4j](https://github.com/advisories/GHSA-43p4-m455-4f4j)
