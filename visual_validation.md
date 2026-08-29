# Kiểm tra giao diện

Ngày kiểm tra: 2026-08-22 (GMT+7)

Các màn hình Tổng quan, Vườn, Nhập mủ, Xuất mủ, Chăm sóc, Nhân công và Báo cáo tiến độ đã được kiểm tra trực quan ở viewport desktop 1280×720. Giao diện dùng hệ thống màu xanh cao su, sidebar điều hành cố định, khoảng trắng hợp lý, trạng thái rỗng nhất quán và điều hướng rõ ràng. Không quan sát thấy lỗi bố cục ở các màn hình đã kiểm tra.

Các màn hình hiện hiển thị trạng thái rỗng vì chưa có dữ liệu vận hành thực tế. Đây là trạng thái dự kiến; ứng dụng không tạo dữ liệu giả.

Kiểm tra bổ sung trên viewport di động 375×812 cho Tổng quan và Báo cáo tiến độ xác nhận thanh tiêu đề di động, các khối chỉ số, vùng lọc và hành động xuất dữ liệu xếp chồng rõ ràng, không có tràn ngang ở trạng thái không có dữ liệu.

Kiểm tra cuối trên desktop xác nhận nhận diện “Cao su 386 Plantation Console” với biểu tượng lá cao su, sidebar điều hành, dashboard và báo cáo được hiển thị ổn định. Màn hình báo cáo dùng cấu trúc sẵn sàng mở rộng thành các cột nhập mủ theo từng ngày khi có dữ liệu thực tế.

Kiểm tra bổ sung cho chức năng sơ đồ lô vườn xác nhận màn hình Vườn hiển thị rõ yêu cầu tải ảnh PNG/JPG/WEBP tối đa 5 MB trên cả desktop và mobile. Vì cơ sở dữ liệu chưa có vườn thực tế, luồng xem trước ảnh và bản đồ gắn với từng vườn được xác minh bằng kiểm thử router thay cho dữ liệu giả.

Sau khi người dùng tải sơ đồ thực tế cho Vườn A (VA-01), ảnh thu nhỏ và nút “Xem sơ đồ” hiển thị đúng trên desktop. Trên mobile, bảng đang ưu tiên ba cột đầu và phần sơ đồ cần cuộn ngang; cần bổ sung chế độ thẻ di động để sơ đồ hiển thị trực quan mà không cần cuộn.

Sau khi bổ sung thẻ mobile, sơ đồ thực tế của VA-01 hiển thị trực tiếp, rõ ràng với nhãn “Xem sơ đồ”, mã vườn, tên vườn, đơn vị và diện tích. Dữ liệu sơ đồ được giữ lại sau khi tải lại giao diện, xác nhận ảnh đã được liên kết với bản ghi vườn.

Xác minh dữ liệu sau tải lên cho thấy VA-01 lưu đúng `mapFileKey`, `mapUrl` và thời điểm cập nhật trên S3. Bản ghi này khớp với ảnh sơ đồ đã hiển thị trên desktop và mobile.

Người dùng đã cung cấp ảnh chụp từ phiên quản trị có xác thực: hộp “Sơ đồ lô vườn — VA-01” đang mở và hiển thị toàn bộ sơ đồ lô đã tải lên. Bằng chứng này xác nhận luồng xem lại sơ đồ từ giao diện quản trị hoạt động đúng.

Đường dẫn lưu trữ được đối chiếu độc lập và trả về ảnh PNG sơ đồ lô VA-01 kích thước 1024×1024. Ảnh khớp với nội dung hiển thị trong hộp xem sơ đồ mà người dùng cung cấp, hoàn tất xác minh tệp được lưu và phục vụ đúng.

Màn hình Import & Excel hiển thị đúng số liệu thực đã nhập: 209 lô vườn (gồm VA-01 có sẵn và 208 lô nguồn), 335 nhân công, 108 bản ghi nhập mủ theo đội, 30 bản ghi xuất mủ theo đội; tổng cộng nhập 638.790 kg và tổng cộng xuất 516.677 kg.

Kiểm tra mobile xác nhận các chỉ số dữ liệu, bộ chọn loại dữ liệu, nút tải mẫu/chọn tệp Excel và khối tổng số liệu hiển thị tuần tự, dễ thao tác trên màn hình hẹp.

Người dùng đã kiểm tra trực tiếp tệp nhập mủ: hệ thống tự nhận diện đúng loại dữ liệu, hiển thị 108 dòng hợp lệ cùng 5 dòng xem trước. Sau khi chuẩn hóa ngày về UTC, dữ liệu nhập mủ được đối chiếu lại còn 108 bản ghi tại 00:00 UTC và tổng cộng nhập 638.790 kg, không còn bản sao lệch múi giờ.

Người dùng đã import lại cùng tệp sau bản sửa UTC. Truy vấn đối chiếu cho thấy dữ liệu vẫn giữ đúng 108 bản ghi, tổng 638.790 kg và chỉ dùng thời điểm 00:00 UTC; import lặp đã cập nhật khóa hiện có thay vì tạo bản sao.

Kiểm tra báo cáo hao hụt kho xác nhận số liệu tổng quan và 36 dòng theo đội/kỳ hiển thị trên desktop. Trên mobile, bảng hiện ưu tiên cột kỳ, đội và cộng nhập; cần bổ sung thẻ chi tiết để hiển thị ngay cộng xuất và tỷ lệ hao hụt, không cần cuộn ngang.

Sau khi tối ưu, mobile hiển thị thẻ riêng cho từng đội/kỳ với cộng nhập, cộng xuất, hao hụt theo kg và tỷ lệ hao hụt, không cần cuộn ngang. Số liệu khớp với đối chiếu nguồn; ví dụ Đội 1, Đợt 1-7 có cộng nhập 6.131 kg, cộng xuất 5.674 kg và hao hụt 7,45%.

Workbook xuất thực tế `bao-cao-hao-hut-kho-Đợt1-7.xlsx` đã được kiểm tra: có đúng 6 cột nghiệp vụ và 6 dòng theo đội. Các giá trị Đội 1 đến Đội 6 khớp với số liệu nguồn và công thức hao hụt của kỳ Đợt 1-7.

Kiểm tra hai trang mới xác nhận biểu mẫu bốn bảng khai thác/chăm sóc hiển thị đầy đủ trường theo dõi cạo mủ và chuyển đổi nhóm công việc. Báo cáo tăng giảm hiển thị các dòng theo đội, vườn và kỳ từ dữ liệu nhập mủ hiện có; phần cộng xuất được tổng hợp theo đội/kỳ.

Dữ liệu từ workbook khai thác chăm sóc đã hiển thị trong trang vận hành: bảng Theo dõi cạo mủ có 6 dòng Đội 1–6 ngày 21/8/2026, tổng KH và TH đều là 332 vườn, tiến độ 100%. Các nhóm Gia cố, Chăm sóc và Phun/bôi thuốc đã được nhập cùng cấu trúc và sẵn sàng chọn trong biểu mẫu.

Workbook tổng hợp chăm sóc được người dùng xuất từ ứng dụng đã được kiểm tra: có đúng 4 sheet dữ liệu, mỗi sheet 6 dòng đội và 15 cột nghiệp vụ. Không có sheet trống; các tổng KH khớp mẫu nguồn gồm cạo mủ 332 vườn, gia cố 996 vườn, chăm sóc 1.582,71 ha và phun/bôi thuốc 258,50 ha.

Kiểm tra mobile xác nhận biểu mẫu khai thác/chăm sóc hiển thị rõ trường Nội dung công việc, toàn bộ trường ngày/đội/vườn/số liệu và nút lưu. Báo cáo tăng giảm hiển thị bộ lọc kỳ, tháng, đội, vườn; bảng số liệu cần cuộn ngang trên mobile do chứa các cột so sánh chi tiết.

Sau tối ưu, báo cáo tăng giảm trên mobile dùng thẻ riêng cho từng đội/vườn/kỳ, hiển thị cộng nhập, cộng xuất đội, tăng/giảm kg và tỷ lệ tăng/giảm ngay trên màn hình mà không cần cuộn ngang bảng.

Kiểm thử workbook dữ liệu một nhóm đã tạo file chỉ có 1 sheet “Theo dõi cạo mủ” cùng 6 dòng thực tế; ba nhóm không có dữ liệu không xuất hiện dưới dạng sheet trống. Kiểm thử tự động cho quy tắc này đã được đưa vào lệnh Vitest hiện hành.

Kiểm tra mobile xác nhận giao diện Cao su CN386 hiển thị mạch lạc trên màn hình 375 px. Màn hình Tài khoản & phân quyền hiển thị đúng biểu mẫu tạo tài khoản, ba nhóm đối tượng, các vai trò chi tiết, phạm vi đơn vị và các công tắc quyền thao tác; chưa có tài khoản nội bộ nào được tạo vì chưa có danh sách người dùng thực tế.

Kiểm tra sau hoàn thiện xác nhận tên thương hiệu Cao su CN386 nhất quán trên dashboard và mobile. Màn hình tài khoản hiển thị rõ biểu mẫu cấp tên đăng nhập/mật khẩu, nhóm, vai trò, phạm vi đội và quyền thao tác trên màn hình 375 px.

Danh sách đăng nhập cập nhật đã được đối chiếu đầy đủ: 29 tài khoản gồm 3 Ban Giám đốc, 9 Cơ quan chức năng và 17 Đội sản xuất. Kiểm thử HTTP xác nhận đăng nhập thành công cho một tài khoản đại diện của mỗi nhóm, với session nội bộ được thiết lập.

Đối chiếu cuối xác nhận `permissionProfile` của đủ 29 tài khoản khớp quy tắc đã cấp theo nhóm, vai trò và phạm vi đơn vị; không có tài khoản bị khóa hoặc sai phạm vi.

Kiểm tra Nhật ký hoạt động xác nhận admin xem được ba sự kiện đăng nhập thực tế với tên tài khoản, tên hiển thị, mô tả và thời gian. Trên mobile 375 px, bộ lọc, tìm kiếm và các thẻ sự kiện xếp dọc rõ ràng, không có tràn ngang.

Kiểm tra cuối trong phiên admin xác nhận lọc theo loại sự kiện, tài khoản, từ ngày và đến ngày hiển thị ổn định trên desktop và mobile. Kiểm thử HTTP đã xác nhận bộ lọc tài khoản/thời gian trả về đúng sự kiện của tài khoản quản trị được chọn.

Sau khi loại bỏ tách bundle React thủ công và xuất bản checkpoint mới, tên miền Cao su CN386 đã hiển thị lại đúng màn hình đăng nhập nội bộ thay vì trang trắng. Bundle production hoàn tất tải và form tên đăng nhập/mật khẩu hoạt động bình thường.

Người dùng đã xác minh trong phiên admin thật trên desktop: chọn tài khoản Nguyễn Hồng Quân (@quannh386) và ngày 22/08/2026 cho kết quả chỉ gồm các sự kiện đăng nhập tương ứng. Điều này xác nhận bộ lọc tài khoản và thời gian hoạt động đúng với dữ liệu thật.

Người dùng đã xác minh lại cùng bộ lọc trong phiên admin thật trên điện thoại. Ảnh mobile cho thấy danh sách chỉ hiển thị các sự kiện đăng nhập của Nguyễn Hồng Quân (@quannh386) ngày 22/08/2026; bộ lọc và thẻ dữ liệu hiển thị rõ ràng, không tràn ngang.

Kiểm thử công cụ trong phiên admin nội bộ đã xác thực đã chọn trực tiếp tài khoản Nguyễn Hồng Quân (@quannh386) và khoảng ngày 22/08/2026, chỉ trả về sáu sự kiện đăng nhập đúng tài khoản. Kiểm tra viewport 375×812 xác nhận bố cục mobile của cùng trang xếp dọc đầy đủ bộ lọc và các thẻ sự kiện.

Đối chiếu cuối kết hợp phiên admin xác thực bằng công cụ với trạng thái lọc tài khoản/thời gian và ảnh kiểm thử thực tế trên điện thoại của quản trị viên. Cả hai xác nhận cùng tài khoản Nguyễn Hồng Quân (@quannh386), cùng ngày 22/08/2026 và cùng tập sự kiện đăng nhập được hiển thị.

Kiểm tra mobile diện rộng cho Tổng quan, Vườn, Nhập mủ, Xuất mủ, Khai thác & chăm sóc, Báo cáo tăng giảm, Nhật ký hoạt động và Tài khoản & quyền cho thấy toàn bộ trang tải được ở viewport 375×812. Các biểu mẫu và thẻ dữ liệu không bị tràn ngang; điểm cần tối ưu là mật độ trên các trang danh sách dài, đặc biệt Vườn, Báo cáo tăng giảm và Tài khoản & quyền.

Sau cập nhật, mobile dùng tiêu đề và nút hành động toàn chiều rộng, thanh điều hướng cao 64 px, bộ lọc Báo cáo tăng giảm dạng lưới hai cột và thẻ dữ liệu gọn. Vườn và Tài khoản & quyền có tìm kiếm nhanh để giảm danh sách dài; thẻ tài khoản trên mobile chỉ hiển thị quyền chính kèm số quyền còn lại. Kiểm tra lại ở viewport 375×812 xác nhận không có tràn ngang tại các trang Vườn, Báo cáo tăng giảm, Tài khoản & quyền và Nhật ký hoạt động.

Sau khi lưu checkpoint phiên bản 1638a61e, các màn hình Vườn, Báo cáo tăng giảm, Tài khoản & quyền và Nhật ký hoạt động đã được kiểm tra lại ở viewport 375×812. Phiên bản đã lưu vẫn giữ đúng tìm kiếm nhanh, bộ lọc lưới, thẻ dữ liệu gọn và bố cục một cột không tràn ngang.

Trang Cài đặt ứng dụng đã được kiểm tra ở viewport 375×812: có nút cài PWA khi trình duyệt hỗ trợ, hướng dẫn Android Chrome và iPhone/iPad Safari, cùng nút mở hệ thống. Mã QR cài đặt mới được giải mã độc lập, dẫn đúng đến `/install` thay vì trang đăng nhập thông thường.

Kiểm tra domain xuất bản tại `https://caosuchinh-xmn7u6kl.manus.space/install` sau checkpoint 03a32ba0 hiện trả về trang 404 trong ứng dụng. Cần sửa định tuyến/triển khai trước khi bàn giao QR cài đặt mới.

Sau khi bundle production hoàn tất cập nhật, domain `https://caosuchinh-xmn7u6kl.manus.space/install` đã tải đúng trang Cài đặt ứng dụng với nút cài PWA, hướng dẫn Android/iPhone và liên kết mở hệ thống. Mã QR đã giải mã dẫn chính xác đến cùng đường dẫn `/install` trên domain này.

Sau khi xuất bản, URL Nhật ký hoạt động với `account=quannh386`, `from=2026-08-22`, `to=2026-08-22` đã được kiểm tra trong phiên admin xác thực. Giao diện tự áp dụng đủ ba bộ lọc và chỉ trả về các sự kiện của Nguyễn Hồng Quân; trạng thái này khớp với kiểm thử mobile thực tế do admin cung cấp.

Trang Cài đặt ứng dụng đã được kiểm tra lại ở viewport 390×844 sau khi bổ sung video: nút cài, hướng dẫn Android Chrome, hướng dẫn iPhone/iPad Safari, thẻ “Video hướng dẫn 30 giây” và các nút điều hướng xếp dọc rõ ràng, không có tràn ngang. Tệp hướng dẫn là video dọc 720×1280, H.264/AAC, thời lượng 30,0 giây, gồm thao tác Android Chrome và cảnh iPhone Safari chọn Chia sẻ → Thêm vào Màn hình chính; liên kết lưu trữ của ứng dụng trả về chuyển hướng hợp lệ đến tệp MP4. Bố cục sau đăng nhập đã gắn banner cài lần đầu và mục “Cài ứng dụng” trong sidebar; banner chỉ hiển thị nếu ứng dụng chưa ở chế độ standalone và chưa có khóa đóng trên thiết bị.

Sau khi có phản ánh tên miền hiển thị trạng thái bảo trì, phản hồi HTTP công khai của trang chủ và `/install` đều trả về thành công. Kiểm tra trực tiếp sau khi ứng dụng tải hoàn tất xác nhận trang chủ hiện dashboard Cao su CN386 cùng menu và banner cài ứng dụng, không còn nội dung bảo trì. Hiện tượng xảy ra trong giai đoạn đồng bộ phiên bản xuất bản; không cần thay đổi mã nguồn ứng dụng.

Trang Nhân công đã được kiểm tra ở desktop 1280×900 và mobile 390×844 sau khi chuyển sang tổng hợp theo đội. Sáu đội được hiển thị riêng với tổng biên chế 335 người; số liệu thực theo đội lần lượt là Đội 1: 60, Đội 2: 54, Đội 3: 64, Đội 4: 25, Đội 5: 68 và Đội 6: 64. Danh sách chỉ hiện Tên phiên âm, có tìm kiếm theo tên phiên âm, thẻ trạng thái hoạt động và các chỉ số biên chế, hoạt động, không hoạt động, thừa và thiếu. Bố cục mobile xếp dọc, không có tràn ngang.

Sau khi lưu chỉ tiêu biên chế do quản trị viên xác nhận, trang Nhân công được kiểm tra lại ở desktop 1280×900 và mobile 390×844. Tổng biên chế và số đang hoạt động đều là 335; cả sáu đội đang đủ biên chế nên chỉ số thừa và thiếu đều bằng 0. Thẻ của Đội 1 hiển thị biên chế 60, danh sách 60, hoạt động 60 và nhãn “Đủ biên chế”; các đội còn lại áp dụng cùng công thức. Nút quản trị “Cập nhật biên chế theo đội” hiển thị cho admin, còn danh sách vẫn chỉ hiện Tên phiên âm.

Xác minh công khai độc lập sau xuất bản cho thấy trang chủ trả về màn hình đăng nhập nội bộ và `/install` trả về đầy đủ hướng dẫn cài ứng dụng cùng video. Không có cấu hình service worker lưu bộ nhớ đệm nội dung; nếu một máy khác vẫn không vào được, cần đối chiếu đúng địa chỉ `https://caosuchinh-xmn7u6kl.manus.space/`, kiểm tra mạng nội bộ có chặn miền `manus.space` hay không và gửi lại thông báo lỗi cụ thể.

Phân loại Vườn A/B/C và Đợt chuẩn được kiểm tra ở desktop 1280×900, mobile 390×844. Trang Vườn có mô tả phân loại, bộ lọc Tất cả/Vườn A/Vườn B/Vườn C/Chưa phân loại và thẻ “Chưa phân loại” cho dữ liệu hiện hữu đang chờ quy tắc phân lô. Biểu mẫu Nhập mủ và Xuất mủ đều sử dụng danh sách chọn Đợt, mặc định Đợt 1; giao diện mobile xếp dọc rõ ràng, không tràn ngang. Báo cáo tiến độ cũng hiển thị bộ chọn Đợt 1 thay cho trường nhập tự do.

Giao diện Phân bổ lô hàng loạt được kiểm tra ở desktop 1280×900 và mobile 390×844. Khu vực này hiển thị sau bộ lọc danh sách Vườn, nêu rõ quy trình lọc → chọn lô → gán Vườn A/B/C và có nút “Chọn lô phân bổ” đủ lớn trên cả hai kích thước. Dialog hỗ trợ chọn từng lô, chọn tất cả kết quả lọc, bỏ chọn, chọn loại vườn và xác nhận cập nhật; thao tác API giới hạn tối đa 500 lô mỗi lần, chỉ admin thực hiện và có ghi nhật ký hoạt động.

Quản lý vườn được kiểm tra lại ở desktop 1280×900 và mobile 390×844 theo yêu cầu danh sách chung. Khối “Danh sách chung” hiển thị sáu đội với các cột/thẻ Vườn A, B, C, diện tích và ngày cạo; dữ liệu hiện tại chưa có phân bổ A/B/C hoặc ngày cạo nên thể hiện trung thực là 0 lô và “Chưa khai báo”. Trên desktop, nút “Xem lô” mở danh sách riêng theo đội; mobile dùng thẻ đội, diện tích và ba nhãn Vườn A/B/C, không có tràn ngang. Danh sách riêng xếp tên lô hiện có theo thứ tự tăng dần, hỗ trợ admin sửa tên Vườn/Lô và ngày cạo.

Ngay sau checkpoint `f5f90b09`, tên miền công khai vẫn phục vụ bundle giao diện Vườn trước đó trong lần kiểm tra đầu, nên đang chờ đồng bộ deployment trước khi kết luận xác minh production. Không đánh dấu hoàn tất xác minh domain cho đến khi nội dung “Danh sách chung” xuất hiện trên tên miền chính thức.

Lần kiểm tra public thứ hai sau khi chờ đồng bộ vẫn hiển thị tiêu đề và bảng Vườn của bundle trước đó, không phải nội dung “Danh sách chung”. Cần tiếp tục kiểm tra gói tĩnh được tên miền phục vụ hoặc khởi động lại dịch vụ xuất bản trước khi xác nhận deployment.

Sau khi quản trị viên xuất bản lại checkpoint, tên miền công khai đã hiển thị đúng giao diện mới. Bảng Danh sách chung có đủ sáu đội, các cột Vườn A/B/C, diện tích, ngày cạo và nút Xem lô; danh sách riêng bên dưới hiển thị Lô, Đội, Vườn, diện tích, ngày cạo, sơ đồ lô cùng thao tác sửa tên Vườn/Lô cho admin. Số liệu hiện tại chưa được phân bổ A/B/C và chưa khai báo ngày cạo nên giữ 0 lô và “Chưa khai báo”, không suy diễn dữ liệu.

Kiểm tra desktop cho cập nhật điều hành cho thấy menu chỉ còn “Khai thác & chăm sóc” và “Quản lý & Nhân công”. Trang quản lý hiển thị ba nhóm Ban Giám đốc, Cơ quan chức năng và Đội sản xuất cùng số hiện có thực tế; danh sách nhân công đã thu gọn ba người/đội với thông báo tài khoản đội xem đầy đủ. Bảng cạo ban đầu trả các đội theo thứ tự giảm, nên đã áp dụng sắp xếp Đội 1 đến Đội 6 trước khi xác minh lần cuối.

Kiểm tra mobile 390×844 xác nhận menu không còn mục Chăm sóc riêng. Trang Quản lý & Nhân công hiển thị tuần tự Ban Giám đốc, Cơ quan chức năng, Đội sản xuất, sau đó Đội 1 đến Đội 6; mỗi đội chỉ lộ ba tên phiên âm cùng thông báo mở đầy đủ bằng tài khoản đội. Trang Khai thác & chăm sóc hiển thị biểu mẫu Theo dõi cạo mủ không có trường Nội dung công việc; bảng cùng ngày đã sắp Đội 1 đến Đội 6 và không có tràn ngang ở khối nhập liệu.

Kiểm tra desktop Báo cáo tiến độ, Hao hụt kho và Báo cáo tăng giảm xác nhận các bảng và xuất liệu dùng thứ tự Đội 1 đến Đội 6. Tại Hao hụt kho, từng kỳ hiển thị liên tiếp Đội 1, 2, 3, 4, 5, 6; bộ lọc và danh sách Báo cáo tăng giảm cũng dùng danh sách đội theo thứ tự vận hành thay vì thứ tự dữ liệu trả về.

Các trang Nhập mủ, Xuất mủ, Import & Excel và Tài khoản & quyền được rà soát: nhật ký Nhập/Xuất mủ giữ thứ tự thời gian nghiệp vụ, Import & Excel là mẫu/tác vụ dữ liệu và Tài khoản & quyền là danh sách tài khoản nên không cần thay thứ tự bảng bằng Đội 1–6. Các màn hình tổng hợp có thứ tự đội hiển thị đã được chuẩn hóa; kiểm tra TypeScript, 36 kiểm thử Vitest và bản dựng production đều đạt.

Xác minh tên miền công khai sau xuất bản checkpoint 836d0bb5 cho thấy menu đã bỏ Chăm sóc riêng và hiển thị Khai thác & chăm sóc, Quản lý & Nhân công. Trang Quản lý & Nhân công công khai hiển thị ba nhóm đội ngũ quản lý, nút admin nhập biên chế, sáu đội theo thứ tự 1–6 và mỗi đội chỉ hiện 3 trên tổng số nhân công, kèm nhắc đăng nhập tài khoản đội để xem đầy đủ.

Trang Quản lý & Nhân công đã được kiểm tra ở desktop 1280×900 và mobile 390×844 sau khi bổ sung báo cáo. Nút Xuất Excel hiển thị cùng nút Thêm nhân công; ô tìm kiếm ghi rõ “Tìm tên phiên âm hoặc mã số”, giữ danh sách rút gọn theo Đội 1–6 và không có tràn ngang trên mobile. Báo cáo Excel được thiết kế theo phạm vi dữ liệu API của tài khoản đang đăng nhập, gồm ba sheet: Đội ngũ quản lý, Tổng hợp theo đội và Danh sách nhân công.

Trường Mã số là tùy chọn và được bổ sung vào biểu mẫu thêm nhân công, mẫu import/export Excel cùng cơ sở dữ liệu; mã đã có sẽ được dùng cho tìm kiếm ngay. Không tự sinh mã số cho 335 nhân công hiện hữu để tránh gán sai dữ liệu nguồn. Kiểm thử TypeScript, 39 kiểm thử Vitest và bản dựng production đều đạt.

Checkpoint 68dd3726 đã được xuất bản. Kiểm tra công khai xác nhận route Quản lý & Nhân công được bảo vệ đúng bằng màn hình đăng nhập nội bộ khi không có phiên xác thực; xác minh giao diện có phiên admin được thực hiện ở môi trường dự án với nút Xuất Excel và ô tìm kiếm tên/mã số hiển thị đúng trên desktop/mobile.

Tổng quan vận hành đã được kiểm tra ở desktop 1280×900 và mobile 390×844. Giao diện hiển thị tổng diện tích 1.582,69 ha, 208 vườn, tổng sản lượng 638.790 kg, nhân công hoạt động, khối Quản lý & nhân công, biểu đồ sản lượng theo kỳ và bảng sáu đội theo đúng thứ tự Đội 1–6. Giá trị sản lượng theo kỳ/tháng không có dữ liệu vẫn hiển thị trạng thái trống rõ ràng, không suy diễn. Biểu mẫu Nhập mủ và Xuất mủ hiển thị chọn Đội trước, sau đó mới chọn lô; danh sách lô sắp theo năm trong ngoặc rồi tên/số lô tăng dần.

Trang Quản lý & Nhân công hiển thị nút “Nhập mã số Excel” cạnh Xuất Excel trên desktop và mobile. Luồng admin có tải mẫu ba cột Đội, Tên phiên âm, Mã số; chọn tệp, xem trước tối đa 20 dòng và xác nhận cập nhật. API từ chối toàn bộ tệp khi thiếu khóa đối chiếu, có nhân công không khớp, mã trùng trong file hoặc mã đã gán cho nhân công khác.

Sau checkpoint 84d3cf5e, kiểm tra tên miền công khai hai lần vẫn nhận bundle Tổng quan cũ (ba thẻ Tổng vườn, Tổng mủ thu hoạch, Nhân công hoạt động). Cần tiếp tục chờ hoặc kích hoạt đồng bộ triển khai trước khi xác nhận bản public mới.

Sau khi đồng bộ dịch vụ, tên miền công khai đã hiển thị đúng Tổng quan mới: tổng diện tích 1.582,69 ha, 208 vườn, tổng sản lượng 638.790 kg, 335 nhân công hoạt động, tổng hợp quản lý/nhân công, lựa chọn Đợt 1–3, biểu đồ sản lượng từng kỳ và bảng tổng quan Đội 1–6. Điều này xác nhận checkpoint 84d3cf5e đã được triển khai công khai thành công.

Trang `/install` được kiểm tra ở 390×844: nút “Cài đặt Cao su CN386” hiển thị rõ, không phụ thuộc vào việc Chrome đã phát lời nhắc hay chưa; video hướng dẫn và lối mở hệ thống vẫn gọn trong một màn hình. Manifest đã có icon PNG 192×192 và 512×512, service worker được đăng ký trước khi render, lời nhắc cài được lưu sớm toàn ứng dụng, và sự kiện `appinstalled` tự ghi trạng thái đã cài để ẩn banner cài đặt.

Sau khi đồng bộ dịch vụ, trang `/install` trên tên miền công khai hiển thị nút “Cài ứng dụng Cao su CN386” thay cho “Xem hướng dẫn cài đặt”. Khi Android phát lời nhắc cài, nút mở trực tiếp hộp thoại native; nếu chưa đủ điều kiện, nút vẫn mở hướng dẫn cài bằng Chrome. Sau cài thành công, sự kiện trình duyệt tự ẩn banner/hộp gợi ý trên thiết bị đó.

Tổng quan vận hành đã được kiểm tra ở desktop 1280×900 và mobile 390×844 sau khi làm lại khối Sản lượng. Khối “Quản lý sản lượng mủ” có ngày, bộ lọc tất cả/từng đội, ba thẻ Mủ đông tạp nhập, Mủ dây nhập, Tổng nhập và số bản ghi. Menu được nhóm gọn thành Điều hành, Báo cáo, Hệ thống trên desktop; mobile giữ header điều hướng tối giản. Không có tràn ngang ở khối lọc hoặc ba thẻ số liệu.

Sau checkpoint fa5ca29a, tên miền công khai ban đầu vẫn hiển thị menu liệt kê cũ và khối Sản lượng cũ. Cần đồng bộ lại dịch vụ xuất bản trước khi xác nhận trải nghiệm public mới.

Sau khi đồng bộ dịch vụ, bản public hiển thị đúng menu nhóm Điều hành, Báo cáo, Hệ thống và khối Quản lý sản lượng mủ. Bộ lọc ngày (21/08/2026) và đội, ba thẻ Mủ đông tạp nhập/Mủ dây nhập/Tổng nhập, số bản ghi đều hiện đúng; với ngày dữ liệu hiện có, các số liệu chi tiết bằng 0 nhưng 6 bản ghi nhập được ghi nhận trung thực. Không có tràn ngang ở desktop và mobile.

Tổng quan được kiểm tra lại ở desktop 1280×900 và mobile 390×844: khối Quản lý sản lượng mủ có chọn Tháng, Năm, Đội và nút Xuất Excel; ba thẻ số liệu nằm gọn theo hàng trên mobile. Khối Nhân công 6 đội có bộ chọn từng đội. Biểu đồ Sản lượng từng kỳ hiển thị theo đúng thứ tự Đợt 1-7, 2-7, 3-7 rồi 1-8, 2-8, 3-8. Các thẻ tổng quan mobile xếp hai cột, giảm chiều cao và không tạo tràn ngang.

Sau xuất bản, tRPC production đã trả về dữ liệu lọc tháng 8/2026 (mủ đông tạp 305.792 kg, mủ dây 860 kg, tổng nhập 306.652 kg, 54 bản ghi nhập và 12 bản ghi xuất). Lần tải đầu trang public vẫn ở trạng thái skeleton nên tiếp tục chờ giao diện hoàn tất trước khi xác nhận hiển thị.

Sau khi kích hoạt lại checkpoint, bản public đã hiển thị đầy đủ bộ lọc Tháng 7/Tháng 8, Năm 2026, Đội 1–6, nút Xuất Excel và chọn đội nhân công. Sản lượng tháng 8/2026 khớp dữ liệu API: 305.792 kg mủ đông tạp, 860 kg mủ dây, tổng 306.652 kg; thứ tự biểu đồ là Đợt 1-7, 2-7, 3-7, 1-8, 2-8, 3-8.

Tổng quan sau tinh chỉnh được kiểm tra ở desktop 1280×900 và mobile 390×844. Desktop có bảng sáu đội với năm cột căn thẳng và hàng giãn đều; mobile thay bảng tràn ngang bằng thẻ đội gọn gồm sản lượng, diện tích, số lô và nhân công. Bộ chọn Kỳ xem chiếm toàn chiều rộng trên mobile; mô tả Phân tích sản lượng và hai nhãn biểu đồ đều lấy kỳ đang chọn động.

Tên miền công khai đã bắt đầu nhận bundle tinh chỉnh; ở lần tải sau khi đồng bộ, ứng dụng hiển thị skeleton trong khi truy vấn dữ liệu. Cần chờ tải hoàn chỉnh thêm một nhịp trước khi xác nhận giao diện public mới.

Sau khi tải dữ liệu hoàn chỉnh, bản public xác nhận mô tả “Phân tích sản lượng” hiển thị động “Đợt 1 đang xem”, cùng nhãn biểu đồ theo kỳ. Bảng sáu đội giữ đúng năm cột và số liệu sản lượng trên desktop; bộ lọc Tháng/Năm/Đội, Xuất Excel và chọn đội nhân công vẫn hoạt động. Kiểm tra mobile từ môi trường dự án xác nhận thẻ đội thay thế bảng tràn ngang và bộ chọn kỳ chiếm toàn chiều rộng.

Tổng quan mở rộng được kiểm tra ở desktop 1280×900 và mobile 390×844. Desktop có khối “Tùy chỉnh cột hiển thị” cho Diện tích, Số lô, Nhân công và Tổng sản lượng; sản lượng tháng 8/2026 so với tháng 7/2026 hiển thị chênh lệch -25.486 kg (-7,67%). Biểu đồ nhân công dùng snapshot thực tế tháng 08/2026 là 335 nhân công hoạt động. Mobile xếp gọn cảnh báo so sánh, biểu đồ và thẻ đội, không có tràn ngang.

Sau khi khởi động lại dịch vụ, bản public đã nhận bundle mở rộng và hiển thị skeleton trong lúc tải dữ liệu. Cần chờ thêm một nhịp để xác nhận đầy đủ nội dung trên tên miền công khai.

Sau khi tải hoàn chỉnh, bản public xác nhận khối so sánh “So với tháng 7/2026: -25.486 kg (-7,67%)”, biểu đồ xu hướng nhân công tháng 08/2026 và vùng Tùy chỉnh cột hiển thị với bốn checkbox. Bảng sáu đội vẫn giữ số liệu và thứ tự đúng, còn mobile dùng thẻ đội nên không tạo tràn ngang.

Tệp `1.import-Vuoncay,lo.xlsx` được kiểm tra có 208 dòng lô hợp lệ, không có khóa trùng theo Đội–Năm trồng–Tên lô; một dòng trống được bỏ qua. Hệ thống cập nhật an toàn cả 208 lô theo mã lô hiện có, bao gồm diện tích, giống, số hố/cây kiểm kê, cây cạo, cây chưa đủ tiêu chuẩn, cây không hiệu quả, cây bệnh không cạo, cây khô miệng cạo, hố trống, mật độ và xếp hạng. Đối chiếu sau nhập xác nhận sáu đội có 208 lô; tổng diện tích là 1.582,69 ha do dữ liệu lưu hai chữ số thập phân.

Tổng quan được kiểm tra ở desktop 1280×900 và mobile 390×844 sau khi thêm so sánh theo đội. Với tháng 8/2026, sáu thẻ Đội 1–6 hiển thị sản lượng hiện tại, sản lượng tháng 7/2026 và chênh lệch riêng; Đội 1 là +3.343 kg (+14,33%), còn Đội 2 là -7.483 kg (-16,79%). Bảng sáu đội vẫn có vùng Tùy chỉnh cột; cấu hình checkbox được lưu qua API theo userId và khôi phục ở lần mở Tổng quan tiếp theo. Mobile xếp các thẻ so sánh theo chiều dọc, không tạo tràn ngang.

Tổng quan được kiểm tra ở desktop 1280×900 và mobile 390×844 sau khi thêm biểu đồ quý. Biểu đồ “So sánh sản lượng theo quý · từng đội” hiển thị sáu chuỗi cột Đội 1–6 theo Quý 3/2026 dựa trên dữ liệu nhập mủ thực tế. Trang Import & Excel có lựa chọn “Chỉ số cây định kỳ”, tải mẫu Excel với khóa Mã lô–Ngày cập nhật, xem trước 5 dòng và chỉ admin được xác nhận nhập. Bố cục mobile giữ nút Xuất toàn bộ Excel, mẫu/tệp Excel và khu vực số liệu đã nhập rõ ràng, không tràn ngang.

Kiểm tra đầu tiên trên tên miền công khai sau checkpoint 1a00e9ea vẫn đang phục vụ bundle trước: Tổng quan đã có so sánh tháng theo đội nhưng chưa thấy biểu đồ quý và phần Import chưa hiển thị lựa chọn Chỉ số cây định kỳ. Cần đồng bộ dịch vụ xuất bản trước khi xác nhận bản public mới.

Sau khi đồng bộ dịch vụ và tải dữ liệu hoàn chỉnh, Tổng quan public đã hiển thị biểu đồ “So sánh sản lượng theo quý · từng đội” với Quý 3/2026, sáu chuỗi Đội 1–6 và trục giá trị kg. Các số liệu lọc Tháng/Năm/Đội, so sánh tháng trước theo từng đội và các cột tùy chỉnh vẫn hoạt động đồng thời.

Trên trang Import & Excel public, danh sách Loại dữ liệu đã có đủ “Vườn / lô”, “Chỉ số cây định kỳ”, “Nhân công”, “Nhập mủ theo đội” và “Xuất mủ theo đội”. Điều này xác nhận lựa chọn nhập chỉ số cây định kỳ đã được triển khai công khai cho phiên quản trị hiện tại; luồng mẫu, xem trước và xác nhận vẫn chỉ cho admin.

So sánh cùng kỳ năm trước được kiểm tra ở desktop 1280×900 và mobile 390×844. Khối mới xác định đúng Quý 3/2026 và yêu cầu đối chiếu với Quý 3/2025 theo từng Đội 1–6. Dữ liệu nguồn hiện chỉ có năm 2026, nên giao diện hiển thị thông báo rõ “Chưa có dữ liệu Quý 3/2025” thay vì tạo số liệu giả; khi dữ liệu năm trước được nhập, biểu đồ cột và các thẻ đội sẽ hiển thị sản lượng năm trước, chênh lệch kg và tỷ lệ tăng/giảm. Mobile hiển thị khối thông báo gọn, không tràn ngang.

Kiểm tra tên miền công khai sau checkpoint đầu tiên cho thấy các dữ liệu tháng và biểu đồ quý hiện có đã tải đúng, nhưng khối “So sánh Quý 3/2026 với cùng kỳ năm trước” chưa xuất hiện trong bundle public. Cần kích hoạt lại đồng bộ triển khai trước khi xác nhận phiên bản công khai.

Sau khi đồng bộ lại triển khai, tên miền công khai đã hiển thị đúng khối “So sánh Quý 3/2026 với cùng kỳ năm trước” ngay dưới biểu đồ quý theo đội. Vì dữ liệu nguồn chỉ có năm 2026, khối hiển thị thông báo “Chưa có dữ liệu Quý 3/2025. Hãy nhập dữ liệu cùng kỳ để hệ thống so sánh theo từng đội.” Đây là trạng thái chính xác, không dùng số liệu giả; khi nhập dữ liệu 2025, biểu đồ và chênh lệch từng đội sẽ tự xuất hiện.

Đối chiếu lại file `1.import-Vuoncay,lo.xlsx` với 208 lô cho tổng diện tích chính xác là 1.582,711 ha. Sau khi nâng trường diện tích lô lên ba chữ số thập phân và phục hồi theo từng mã lô, tổng theo đội lần lượt là Đội 1: 283,131 ha; Đội 2: 268,496 ha; Đội 3: 299,462 ha; Đội 4: 123,210 ha; Đội 5: 317,422 ha; Đội 6: 290,990 ha. Kiểm thử TypeScript, 47 kiểm thử Vitest và build đều đạt.

Kiểm tra công khai cuối cùng đã xác nhận tổng diện tích mới 1.582,711 ha và sáu giá trị theo đội được hiển thị đủ ba chữ số thập phân: Đội 1: 283,131 ha; Đội 2: 268,496 ha; Đội 3: 299,462 ha; Đội 4: 123,210 ha; Đội 5: 317,422 ha; Đội 6: 290,990 ha. Tên miền đã nhận đúng bundle định dạng mới; bảng sáu đội và thẻ Tổng diện tích đồng nhất với số liệu Excel nguồn.

Sau checkpoint đổi giao diện sang hai chữ số thập phân, lần kiểm tra công khai đầu vẫn đang phục vụ bundle cũ với 1.582,711 ha và các giá trị theo đội ba chữ số. Cần đồng bộ lại dịch vụ xuất bản trước khi kết luận cập nhật hiển thị hai chữ số đã đến tên miền công khai.

Sau khi đồng bộ triển khai và tải lại hoàn chỉnh, tên miền công khai đã hiển thị đúng giao diện hai chữ số thập phân: Tổng diện tích 1.582,71 ha; Đội 1: 283,13 ha; Đội 2: 268,50 ha; Đội 3: 299,46 ha; Đội 4: 123,21 ha; Đội 5: 317,42 ha; Đội 6: 290,99 ha. Thay đổi chỉ tác động cách hiển thị; dữ liệu lô vẫn được lưu chính xác đến ba chữ số thập phân.

Ảnh mẫu cho Quản lý & Nhân công xác định hai điểm thao tác cần bổ sung: nút Nhập Quản lý nằm sau nút Nhập biên chế đội ngũ quản lý trong cùng hàng dưới ba thẻ Ban Giám đốc, Cơ quan chức năng và Đội sản xuất; nút Xem danh sách nằm tại vùng bên phải của mỗi thẻ Đội nhân công, sau phần tóm tắt nhân công đầu thẻ.

Xác minh desktop và mobile trên bản phát triển cho thấy nút Nhập Quản lý xuất hiện cạnh nút Nhập biên chế đội ngũ quản lý; mỗi thẻ Đội 1–6 cũng có nút Xem danh sách màu cam, không gây tràn bố cục. Lần kiểm tra công khai đầu sau checkpoint vẫn phục vụ bundle cũ nên chưa hiển thị hai nút; cần đồng bộ lại triển khai trước khi xác nhận bàn giao.

Sau khi đồng bộ lại triển khai, tên miền công khai đã tải đúng bundle: nút Nhập Quản lý nằm cạnh Nhập biên chế đội ngũ quản lý và có sáu nút Xem danh sách tương ứng Đội 1–6. Nội dung tóm tắt vẫn giới hạn ba nhân công trên thẻ; danh sách đầy đủ được mở theo phạm vi quyền tài khoản.

Nút Nhập Quản lý đã được kiểm tra trực tiếp và chuyển tới biểu mẫu cấp tài khoản nội bộ. Biểu mẫu cho phép chọn nhóm, vai trò và quyền; cần đặt sẵn nhóm Ban Giám đốc khi mở từ nút này để tránh nhầm với mặc định Đội sản xuất của biểu mẫu dùng chung.

Luồng Nhập Quản lý sau tinh chỉnh mở biểu mẫu có tiêu đề Nhập Quản lý, chọn sẵn nhóm Ban Giám đốc và vai trò Ban Giám đốc. Người quản trị vẫn có thể đổi sang Cơ quan chức năng hoặc Đội sản xuất trước khi cấp tài khoản. TypeScript, 48 kiểm thử Vitest, build và ảnh xác minh desktop/mobile đều đạt.

Tìm kiếm và xuất Excel theo Đội được đặt trong hộp Danh sách nhân công của từng Đội, do đó chỉ thao tác trên dữ liệu tài khoản có quyền xem. Khối Lịch sử biến động nhân công theo tháng hiển thị dữ liệu snapshot thực tế với trạng thái trung thực: hiện chỉ có Tháng 8/2026 (335 đang hoạt động, 335 tổng danh sách), chưa có tháng trước để tính chênh lệch. Ảnh desktop/mobile xác nhận bảng lịch sử, nút Chốt số liệu tháng này và thẻ đội không tràn bố cục.

Lịch sử tháng dùng bảng workforce_monthly_snapshots hiện có và cho phép quản trị viên chốt lại snapshot của tháng hiện tại bằng số lượng nhân công thực tế. Khi dữ liệu có từ hai tháng, bảng tự tính chênh lệch số đang hoạt động và tổng danh sách so với tháng liền trước; không tạo số liệu cho các tháng chưa có nguồn.

Ảnh chú thích Báo cáo hao hụt kho xác nhận cần thêm bộ lọc Tháng cạnh bộ lọc Đợt. Khi chưa chọn Đợt/Tháng, các thẻ Cộng nhập, Cộng xuất và Hao kho giữ số liệu tổng hợp hiện tại; khi người dùng chọn Đợt hoặc Tháng, thẻ số liệu phải phản ánh đúng tập dữ liệu đã lọc. Công thức hao kho giữ nguyên: (Cộng nhập − Cộng xuất) / Cộng nhập × 100%.

Ảnh bảng hao hụt kho yêu cầu các dòng được sắp theo thứ tự kỳ mới đến cũ, trước hết theo tháng mới rồi theo Đợt mới trong tháng; mỗi kỳ vẫn liệt kê Đội 1 đến Đội 6 theo thứ tự cố định. Các cột Cộng nhập, Cộng xuất, Hao hụt (kg) và Hao hụt (%) giữ nguyên ý nghĩa nghiệp vụ.

Ảnh Báo cáo tăng giảm yêu cầu khi các bộ lọc ở trạng thái Tất cả, phần diễn biến hiển thị tổng chung và chi tiết từng Đội đến thời điểm hiện tại; khi người dùng chọn Kỳ/Tháng/Đội/Vườn, bảng chỉ hiện đúng tập dữ liệu theo lựa chọn. Danh sách Đợt trong bộ lọc phải tự lấy từ kỳ có dữ liệu nguồn, không hiển thị Đợt 1, Đợt 2, Đợt 3 trống; sau khi nhập dữ liệu, kỳ mới xuất hiện tự động.

Đã xác minh báo cáo hao hụt kho trên desktop/mobile: bộ lọc có cả Đợt và Tháng, chỉ liệt kê kỳ có dữ liệu nguồn; bảng hiện đúng thứ tự Đợt 3-8, Đợt 2-8, Đợt 1-8, Đợt 3-7, Đợt 2-7, Đợt 1-7; mỗi kỳ giữ Đội 1 đến Đội 6. Các thẻ số liệu thay đổi theo bộ lọc.

Đã xác minh Báo cáo tăng giảm có khối Tổng hợp đến thời điểm hiện tại gồm Tổng chung và Đội 1–6; khi chọn Kỳ, Tháng, Đội hoặc Vườn, tiêu đề và tổng hợp chuyển sang chỉ dữ liệu lọc. Tổng xuất không bị lặp lại theo số vườn trong cùng Đội/kỳ.

Snapshot nhân công theo Đội đã dùng số liệu thực tế Tháng 8/2026: Đội 1: 60; Đội 2: 54; Đội 3: 64; Đội 4: 25; Đội 5: 68; Đội 6: 64, đều đang hoạt động. Biểu đồ xu hướng theo Đội hiển thị snapshot này; chưa có tháng trước nên không phát sinh biến động giả. Lịch tự động đã bật, kiểm tra lúc 00:05 mỗi ngày theo giờ Việt Nam và chỉ chốt vào ngày 01 của tháng.

Mẫu phân chia nhân công vườn cây được đối chiếu theo đúng cấu trúc nhóm Vườn A, B, C: mỗi dòng có sẵn Đội, tên La tinh và mã số nhân công; mỗi nhóm yêu cầu Mã lô, Từ hàng, Đến hàng, Diện tích. File xuất có 335 nhân công thuộc Đội 1–6, 208 lô hệ thống và sheet Hướng dẫn import. Luồng Import & Excel nhận diện đúng tiêu đề hai hàng của mẫu, tách tối đa ba phân công trên mỗi dòng, kiểm tra đội/nhân công/mã lô/hàng/diện tích và từ chối xung đột loại vườn.

Biểu đồ Phân bố diện tích vườn cây đã được xác minh trên desktop và mobile. Cột theo Đội hiển thị diện tích thực: Đội 1: 283,13 ha; Đội 2: 268,50 ha; Đội 3: 299,46 ha; Đội 4: 123,21 ha; Đội 5: 317,42 ha; Đội 6: 290,99 ha. Khu vực nhân công chọn từng Đội và hiển thị trạng thái trống trung thực vì chưa có bản ghi phân chia lô/diện tích; không tạo số liệu giả. Bố cục mobile xếp theo một cột, không che biểu đồ hoặc bộ chọn Đội.

Bộ lọc Vườn A/B/C đã được kiểm tra trên desktop và mobile trong khối Phân bố diện tích vườn cây. Bộ chọn hiển thị Tất cả loại vườn, Vườn A, Vườn B, Vườn C và áp dụng chung cho biểu đồ theo Đội cùng khu vực nhân công. Hiện 208 lô đều chưa phân loại Vườn A/B/C nên chế độ Tất cả hiển thị tổng thực tế, còn từng lựa chọn A/B/C giữ trạng thái rỗng minh bạch; khi dữ liệu phân loại được nhập, kết quả sẽ tự hiển thị theo bộ lọc.

Quản lý vườn đã được xác minh trên desktop và mobile theo mẫu mới: các thẻ tổng diện tích Vườn A/B/C, cột Ngày cạo và Sơ đồ lô không còn hiển thị; bảng chung chỉ giữ Đội, số lô Vườn A/B/C, diện tích và thao tác. Nút Xem lô đổi thành Xem riêng; quản trị viên có thêm Chỉnh sửa để mở phân bổ lô theo Đội và Import để chuyển đến Import & Excel. Hộp Phân bổ lô có thêm Từ hàng, Đến hàng, Diện tích và Số cây cạo; các trường để trống không ghi đè số liệu hiện có.

Import & Excel đã được xác minh trên desktop/mobile với bố cục một cột rõ ràng trên điện thoại. Khi chọn file có cột Đội, giao diện hiện khối Tiến trình theo Đội, nêu số dòng và các trạng thái Sẵn sàng, Đang nhập, Hoàn tất hoặc Lỗi; trong khi đọc tệp có hiệu ứng tải riêng. Sau thành công, giao diện hiển thị kết quả số dòng xử lý, hợp lệ và lỗi.

Quản lý vườn có nút Lịch sử phân bổ dành cho quản trị viên, lọc theo Đội đang chọn và hiển thị người thao tác, thời điểm, Vườn A/B/C, số lô, hàng, diện tích, số cây cạo khi có. Chưa có phân bổ thực tế nên hộp lịch sử hiển thị trạng thái rỗng trung thực; các phân bổ mới sẽ được ghi riêng theo Đội.

Hộp Lịch sử chỉnh sửa phân bổ lô có thêm nút Xuất Excel. File sử dụng đúng phạm vi Đội đang xem, gồm thời điểm UTC, Đội, người thao tác, tên đăng nhập, Vườn phân bổ, số lô, từ/đến hàng, diện tích, số cây cạo và nội dung thay đổi. Kiểm thử đơn vị xác nhận đầy đủ trường dữ liệu trong mỗi hàng xuất; tải thư viện Excel chỉ diễn ra khi bấm nút xuất.

Biểu mẫu Theo dõi cạo mủ đã được xác minh trên desktop/mobile: giữ Vườn, Diện tích và Phần cạo; trường TH được đổi thành Cạo xong (Vườn), Vườn hoàn thành đổi thành % hoàn thành tính tự động theo KH/TH; các trường Chưa cạo, Cạo chưa xong và Cạo tiếp vườn hiển thị đúng thứ tự. Với Gia cố keo, máng, tấm che; Chăm sóc; Phun, bôi thuốc, biểu mẫu không hiện Vườn, Diện tích, Phần cạo và dùng % hoàn thành tự tính, không thay đổi dữ liệu lịch sử đã lưu.

Mỗi bảng theo dõi có nút Xuất Excel bảng này ở phần danh sách dữ liệu. Desktop đặt nút ở góc phải bảng; mobile đặt gọn phía trên bảng, không che nội dung. File cạo mủ có các cột riêng Vườn, Diện tích, Phần cạo, Chưa cạo, Cạo chưa xong, Cạo tiếp vườn; Gia cố, Chăm sóc, Phun/bôi thuốc dùng các cột chỉ tiêu phù hợp và Chăm sóc/Phun có thêm Nội dung công việc.

Bộ lọc Từ ngày và Đến ngày đã được xác minh trên desktop/mobile trước bảng dữ liệu. Hai ngày là bao gồm, tự giới hạn để ngày kết thúc không trước ngày bắt đầu; nút Đặt lại xóa khoảng đang chọn. Tổng KH/TH, bảng và file Excel riêng đều dùng cùng tập bản ghi sau lọc; khi không chọn khoảng ngày, hệ thống hiển thị/xuất toàn bộ dữ liệu của bảng theo dõi đang xem.

Màn hình Import & Excel đã hiển thị khối Sao lưu dữ liệu hằng tuần cho quản trị viên trên desktop/mobile. Khối nêu rõ lịch 00:15 Chủ nhật theo giờ Việt Nam, chính sách giữ 8 bản gần nhất và quy tắc loại trừ mật khẩu/bí mật xác thực; có nút Sao lưu ngay, danh sách bản sao cùng nhãn nguồn, số bản ghi, dung lượng và nút Tải. Bản sao đầu tiên được tạo từ dữ liệu thực có 755 bản ghi, 9 sheet nghiệp vụ và tải lại thành công để đối chiếu; kiểm tra nội dung xác nhận không có trường mật khẩu.

Biểu mẫu Xuất mủ đã được xác minh trên desktop/mobile: trường Lô đối chiếu không còn hiển thị; bản ghi và nhật ký chỉ dùng Đội, ngày, Đợt, mủ đông tạp và mủ dây. Khối Hao kho dự kiến hiện ngay dưới hai ô số liệu, dùng số liệu nhập cùng Đội/Đợt và cộng xuất đã ghi để tính sau bản xuất đang nhập; khi chưa chọn Đội, giao diện nêu rõ cần chọn Đội thay vì tạo số liệu giả. Bố cục mobile xếp dọc rõ ràng, không che biểu mẫu hoặc nhật ký.
Kiểm tra trang Xuất mủ sau cập nhật ở desktop 1280×720 và mobile 375×812 xác nhận khối Nhật ký Xuất mủ có hai trường Từ ngày/Đến ngày, nút Đặt lại và nút Xuất Excel. Khoảng ngày áp dụng bao gồm cả hai đầu mốc; Đặt lại khôi phục toàn bộ nhật ký. File Excel yêu cầu chọn Đội và chỉ xuất đúng các bản ghi thực của Đội đó đang nằm trong khoảng lọc, với các cột Ngày xuất, Đội, Đợt, Mủ đông tạp, Mủ dây và Cộng xuất. Bố cục mobile xếp trường lọc và nút hành động theo chiều dọc, không quan sát thấy tràn ngang ngoài bảng dữ liệu có thể cuộn.
Kiểm tra Nhật ký Xuất mủ mở rộng trên desktop 1280×720 và mobile 375×812 xác nhận có bộ lọc Đợt cùng Từ ngày/Đến ngày, nút Đặt lại và Xuất Excel. Bảng báo cáo hiển thị thêm Người lập lấy từ tài khoản tạo bản ghi thực tế; các bản ghi cũ không có ghi chú được thể hiện là “—”, không tự điền dữ liệu. File Excel chứa hai cột Người lập/Ghi chú và một dòng “Tổng khối lượng” cộng riêng mủ đông tạp, mủ dây và cộng xuất của đúng tập Đội–Đợt–ngày đã lọc. Trên mobile, các điều khiển xếp dọc và bảng vẫn có thể cuộn ngang để xem đủ cột.
Trang Sản lượng theo lô được kiểm tra ở desktop 1280×720 và mobile 375×812. Biểu mẫu chọn Lô trực tiếp từ danh mục hệ thống, tự hiển thị Năm trồng/Diện tích để đối chiếu, cho phép nhập tay Mủ đông/tạp và Quy khô cùng ngày, ghi chú. Khu vực Import có tải mẫu chứa Mã lô/Tên lô theo danh mục và xem trước trước khi nhập; bảng tổng hợp có lọc Đội, Năm, Tháng, hai chỉ số tổng và xuất Excel theo đúng mẫu STT, Lô, Năm trồng, Diện tích, Mủ đông/tạp, Quy khô. Khi chưa có dữ liệu nguồn theo lô, giao diện hiển thị trạng thái rỗng trung thực; truy vấn xác nhận bảng mới có 0 bản ghi, không tạo số liệu giả.
Biểu mẫu Theo dõi cạo mủ được kiểm tra tại desktop 1280×720 và mobile 375×812. Hai trường Diện tích (ha) và Phần cạo đã không còn hiển thị trong phần nhập mới; bố cục liền mạch từ Vườn đến KH/Cạo xong. Các chỉ tiêu theo dõi còn lại, bộ lọc ngày và xuất Excel vẫn hiển thị bình thường. Việc chỉnh sửa chỉ gửi giá trị trống cho hai trường ở bản ghi mới; dữ liệu lịch sử trong cơ sở dữ liệu không bị thay đổi.
Các trang Báo cáo tiến độ, Quản lý & Nhân công, Khai thác & chăm sóc được kiểm tra ở desktop 1280×720 và mobile 375×812. Báo cáo tiến độ chỉ hiển thị tên Lô và Đội trong bảng/Excel, không còn mã lô kỹ thuật. Thẻ Nhân công theo Đội chỉ giữ số liệu biên chế, trạng thái và nút Xem danh sách; tên nhân công chi tiết chỉ xuất hiện trong hộp thoại theo phạm vi quyền. Biểu mẫu Theo dõi cạo mủ có trường Vườn dạng danh sách thả xuống, bị khóa cho đến khi chọn Đội và chỉ nhận các lô/vườn thuộc Đội đó. Không thấy tràn ngang ngoài bảng dữ liệu có thể cuộn.
Kiểm tra Khai thác & chăm sóc và Báo cáo tiến độ ở desktop 1280×720 và mobile 375×812 xác nhận: trường Đội là danh sách chọn; Tìm nhanh Lô chỉ khả dụng sau khi chọn Đội, hỗ trợ tìm tên Lô không phân biệt dấu và năm trồng; danh sách Vườn/Lô chỉ chứa các lô thuộc Đội đang chọn. Bộ lọc Đội Báo cáo tiến độ được đặt cạnh chọn Đợt; bảng, số tổng, trạng thái rỗng, CSV/XLSX và tên file đều sử dụng đúng tập Đội đang lọc. Bố cục mobile xếp các trường dọc, không quan sát thấy tràn ngang ngoài bảng báo cáo có thể cuộn.
Biểu mẫu Theo dõi cạo mủ được kiểm tra trên desktop 1280×720 và mobile 375×812. Trường Đội vẫn là danh sách chọn; khi trình duyệt có lựa chọn Đội đã lưu hợp lệ, biểu mẫu tự điền lại lựa chọn đó trên cùng thiết bị. Sau khi chọn Đội, khu vực tìm nhanh hiển thị “Có n Lô thuộc Đội …”; khi gõ từ khóa, nội dung đổi thành “Tìm thấy x/n Lô”. Việc lưu cục bộ được kiểm thử độc lập cho các trường hợp lưu, đọc và xóa; không làm gián đoạn thao tác nếu trình duyệt chặn lưu cục bộ. Bố cục mobile không phát sinh tràn ngang.
Danh sách Quản lý vườn được kiểm tra ở desktop 1280×720 và mobile 375×812. Thứ tự Lô trong từng Đội được chuẩn hóa theo năm trồng tăng dần; trong cùng năm, toàn bộ Lô số đơn tăng dần (Lô 1 đến Lô 20) đứng trước các Lô có hậu tố (như Lô 3-2012, Lô 4-2012), sau đó tiếp tục tăng theo phần số/tên. Quy tắc dùng chung cho Danh sách lô, tìm/chọn Lô trong Khai thác & chăm sóc, Nhập mủ, Chăm sóc, Sản lượng theo lô và các sheet danh mục trong Xuất toàn bộ Excel. Kiểm thử đơn vị bao gồm trường hợp Lô 1, Lô 4, Lô 20, Lô 3-2012, Lô 4-2012 cùng năm trồng.
Trang Quản lý vườn được kiểm tra trên desktop 1280×720 và mobile 375×812. Phía trên danh sách Lô có khối “Tổng diện tích theo năm trồng”, hiển thị từng năm, số Lô và tổng ha được cộng từ các Lô đang hiển thị. Khối này áp dụng đồng thời phạm vi Đội, bộ lọc Vườn A/B/C và tìm kiếm; năm chưa khai báo được tách thành “Chưa rõ năm” ở cuối, không gán năm hoặc diện tích giả. Bố cục thẻ tự xuống dòng trên màn hình điện thoại, không gây tràn ngang.
Danh sách Lô được kiểm tra ở desktop 1280×1400 và mobile 375×812. Khi chọn Toàn cơ quan, các Lô được nhóm theo Đội theo thứ tự Đội 1 đến Đội 6: hệ thống hiển thị hết Lô của một Đội trước khi sang Đội kế tiếp, không còn xen kẽ Đội 1/Đội 2 theo năm trồng. Trong từng Đội, quy tắc năm trồng rồi Lô số đơn/hậu tố tăng dần vẫn được giữ. Cùng quy tắc được áp dụng cho danh sách lựa chọn và file Excel danh mục để bảo đảm thứ tự nhất quán.
Danh sách Lô được kiểm tra ở desktop 1280×1500 và mobile 375×812. Sau khu vực tổng diện tích theo năm có thanh “Đi đến Đội” với các nút Đội 1–Đội 6; mỗi nút cuộn mượt đến đúng nhóm theo ID neo an toàn. Mỗi nhóm có tiêu đề Đội, số Lô và tổng diện tích tính trực tiếp từ các Lô hiện trong nhóm, kèm nút Thu gọn/Mở rộng có trạng thái aria-expanded. Khi thu gọn, chỉ còn thông báo số Lô, không xóa hay thay đổi dữ liệu. Các bảng desktop và thẻ mobile chỉ hiện các Lô của đúng Đội trong nhóm; không quan sát thấy tràn ngang bất thường.
Tiêu đề từng nhóm Đội được kiểm tra ở desktop 1280×1500 và mobile 375×812. Bên dưới số Lô/tổng diện tích xuất hiện các nhãn Vườn A, Vườn B, Vườn C với số Lô thực tế trong đúng nhóm Đội đang lọc; Lô chưa phân loại không bị gán vào A/B/C. Nút Xuất Excel nằm trên cùng thanh tiêu đề, tách riêng từng Đội và tạo workbook một sheet với tiêu đề, số Lô, tổng diện tích và các cột danh mục Lô theo thứ tự hiện có. Trên mobile, nhãn, nút Excel và điều khiển thu gọn tự xuống hàng, không gây tràn ngang.
Danh sách Lô theo Đội được kiểm tra tại desktop 1280×1600 và mobile 375×812. Thanh tiêu đề Đội hiển thị Vườn A/B/C với số Lô và tổng diện tích chi tiết của từng Vườn. Khi mở rộng Đội, Lô được chia thành các khu vực Vườn A, Vườn B, Vườn C rồi Chưa phân loại, đúng thứ tự và vẫn giữ quy tắc năm trồng/số Lô bên trong mỗi khu vực. Ở dữ liệu hiện có, các Vườn A/B/C chưa được phân bổ nên tổng diện tích mỗi Vườn hiển thị 0,00 ha và toàn bộ Lô nằm trong khu vực Chưa phân loại; không tạo số liệu thay thế. Bố cục nhãn và danh sách vẫn xuống dòng hợp lý trên mobile.
Biểu đồ “Diện tích Vườn A/B/C theo Đội” được kiểm tra trên Tổng quan vận hành ở desktop 1280×1400 và mobile 375×812. Biểu đồ cột nhóm sử dụng ba chuỗi Vườn A, B, C và trục Đội; tooltip định dạng đơn vị ha. Dữ liệu được tổng hợp trực tiếp từ danh mục Lô trong phạm vi dữ liệu tài khoản được phép xem. Hiện chưa có Lô được phân bổ A/B/C nên màn hình hiển thị trạng thái hướng dẫn phân loại thay vì vẽ giá trị giả; kiểm thử đơn vị xác nhận tổng diện tích và thứ tự Đội khi có dữ liệu. Bố cục mobile giữ thông báo/trục không tràn ngang.
Trang Sản lượng theo lô được kiểm tra trên desktop 1280×1100 và mobile 375×812. Biểu mẫu nhập tay nay dùng hai trường chọn Tháng và Năm, thay cho Ngày; dữ liệu được chuẩn hóa về ngày đầu tháng UTC khi lưu nên mỗi Lô có tối đa một bản ghi trong một Tháng/Năm. Khu vực Import, hướng dẫn, mẫu Excel và bản xem trước đều hiển thị Tháng/Năm, vẫn chấp nhận cột Ngày từ mẫu cũ để giữ dữ liệu lịch sử. Bảng tổng hợp/Excel đặt cột Đội trước Lô. Dữ liệu sản lượng theo lô hiện rỗng nên giao diện giữ trạng thái rỗng trung thực; kiểm thử bao phủ chuẩn hóa kỳ và hàng Excel.
Trang Sản lượng theo lô được kiểm tra tại desktop 1280×1500 và mobile 375×812. Khu vực Nhập nhanh nhiều Lô cho chọn Đội, Tháng/Năm, thêm tối đa 200 dòng Lô, ngăn lặp Lô và lưu một lần; các Lô chỉ lấy từ Đội đã chọn. Khối chốt kỳ hiển thị rõ “chưa chốt/đã chốt”; chỉ quản trị viên thấy nút Chốt tháng/Mở khóa, còn các ô nhập tay, nhập nhanh và nút Import bị khóa khi kỳ tương ứng đã chốt. Báo cáo có biểu đồ cột nhóm Mủ đông/tạp và Quy khô theo Đội, theo đúng bộ lọc hiện hành. Dữ liệu theo Lô hiện rỗng nên biểu đồ/khối tổng hợp hiển thị trạng thái rỗng trung thực, không tạo số liệu giả. Bố cục mobile xếp điều khiển theo chiều dọc, không tràn ngang.
Danh sách Lô theo Đội được kiểm tra trên desktop 1280×1100 và mobile 375×812. Bảng desktop trong từng nhóm Vườn có cột Vườn đặt giữa Lô và Diện tích, dùng nhãn Vườn A, Vườn B, Vườn C hoặc Chưa phân loại cho đúng từng Lô. Trên mobile, cùng thông tin đã hiển thị bằng nhãn Vườn trong thẻ Lô. Với dữ liệu hiện tại, các Lô chưa được phân bổ được ghi nhận rõ “Chưa phân loại”, không tự suy diễn Vườn A/B/C. Bố cục bảng desktop có thể cuộn ngang nếu cần; thẻ mobile không tràn ngang.
Danh sách Lô được kiểm tra ở desktop 1280×1200 và mobile 375×812. Bộ lọc Vườn chuyển sang các nút nhận diện rõ Tất cả, Vườn A (xanh lá), Vườn B (xanh dương), Vườn C (vàng) và Chưa phân loại; áp dụng cùng phạm vi Đội đang chọn. Các dòng Lô và nhãn Vườn dùng cùng màu nền nhẹ để nhận biết nhanh; khi chưa có phân bổ A/B/C, chỉ nút Chưa phân loại trả về dữ liệu thực tế. Excel riêng từng Đội có thêm khối Tổng diện tích theo Vườn, gồm số Lô/diện tích Vườn A, B, C, Chưa phân loại và Tổng cộng trước bảng chi tiết. Kiểm thử đơn vị xác nhận phép cộng diện tích, bao gồm diện tích dạng chuỗi và Lô chưa phân loại.
Biểu đồ tròn tỷ trọng diện tích Vườn được kiểm tra trong từng nhóm Đội ở desktop 1280×1400 và mobile 375×812. Khi Đội có diện tích đã phân bổ A/B/C, biểu đồ hiển thị ba lát Vườn A (xanh lá), B (xanh dương), C (vàng), tổng diện tích ở tâm và thẻ chú giải diện tích/tỷ trọng. Khi tổng A/B/C bằng 0, biểu đồ được thay bằng thông báo rõ ràng để không vẽ hoặc suy diễn số liệu. Kiểm thử đơn vị xác nhận tổng diện tích, tỷ trọng từng Vườn và trường hợp tổng bằng 0.
