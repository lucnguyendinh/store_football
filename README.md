Bạn là 1 senior Nextjs (+5 năm kinh nghiệm) hãy giúp tôi tạo 1 project quản lý quần áo bóng đá bằng nextjs với những yêu cầu sau:
+ Chung cả be lẫn fe cùng 1 project (Nextjs 14, sử dụng app router, typescript, tailwindcss)
+ db sử dụng monggodb (monggooes)
+ cloud để lưu image: cloudinary
+ có responsive
+ khách vãng lai không cần đăng nhập, admin set cứng tài khoản, mật khẩu trong env 
+ Admin đăng nhập qua /admin/login, sau khi login sẽ set cookie httpOnly. Sử dụng middleware.ts để bảo vệ toàn bộ route /admin/*
+ có các page sau
    + trang chủ (domain/) hiển thị danh sách quần áo bóng đá, có 1 input search theo keyword có thể filter theo tên, tag, có 1 dropdown để filter theo loại (Player/ Fan), 1 dropdown để filter theo Đội. Mỗi khi filter thì sẽ tự động cập nhật URL để có thể chia sẻ link đã filter, khi click vào sản phẩm sẽ vào trang chi tiết sản phẩm
    + trang chi tiết (domain/product/[id]) hiển thị chi tiết sản phẩm, có nút mua hàng, khi click vào sẽ hiện form điền thông tin khách hàng (tên, số điện thoại, địa chỉ), sau đó lưu đơn hàng vào database
    + trang chủ dành cho admin (domain/admin) bắt buộc đăng nhập, không đăng nhập redirect về trang chủ, UI tương tự trang chủ (domain), nhưng trên header có thêm nút logout, và thêm sản phẩm. từng sản phầm sẽ có thể 3 nút (delete, edit, detail). riêng edit và create thì sẽ hiện thị ra popup để điền thông tin sản phẩm (tên, giá, tag, loại, đội), detail thì sẽ vào trang mới (domain/admin/product/[id]), delete thì cũng hiện lên popup comfirm
    + trang quản lý đơn hàng (domain/admin/orders) hiển thị danh sách đơn hàng, có thể filter theo trạng thái (đang xử lý, đã xác nhận), có thể click vào từng đơn hàng để xem chi tiết và cập nhật trạng thái đơn hàng.
+ Enity product:
type ProductType = 'PLAYER' | 'FAN'

type Team =
  | 'LIVERPOOL'
  | 'MU'
  | 'ARSENAL'
  | 'CHELSEA'
  | 'MAN_CITY'
  | 'REAL'
  | 'BARCA'
  | 'NATIONAL'
  | 'SALE'
  | 'OTHER'

type Size = 'S' | 'M' | 'L' | 'XL' | 'XXL' | 'XXXL'
```javascript
{
  name: String,
  price: Number,
  tag: [String],
  type: ProductType,
  team: Team,
  size: {
    số lượng: Number,
    size: Size,
  }[],
  description: String,
  imageUrl: [String],
}
```+ Entity order:
```javascript{
  customerName: String,
  phoneNumber: String,
  address: String,
  productId: mongoose.Schema.Types.ObjectId,
  quantity: Number,
  uuid: String, // UUID để theo dõi đơn hàng của khách vãng lai
  status: String, // Processing, Confirmed
}
+ dùng cookie UUID để nhớ user theo trình duyệt mà không cần đăng nhập để có thể theo dõi đơn hàng
+ Thêm các lazy load cho hình ảnh sản phẩm để tối ưu hiệu suất
+ Sử dụng Next.js API routes để xử lý các yêu cầu từ frontend và tương tác với MongoDB
+ Sử dụng Context API để quản lý trạng thái ứng dụng