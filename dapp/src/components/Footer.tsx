function Footer() {
  return (
    <footer className="footer py-4  ">
      <div className="container-fluid">
        <div className="row align-items-center justify-content-lg-between">
          <div className="col-lg-6 mb-lg-0 mb-4">
            <div className="copyright text-left text-sm text-muted text-lg-start">
              Built by <a href="https://github.com/EduardoSilva09" className="font-weight-bold ms-1" target="_blank">Eduardo</a>
            </div>
          </div>
          <div className="col-lg-6">
            <ul className="nav nav-footer justify-content-center justify-content-lg-end">
              <li className="nav-item">
                <a href="#" className="nav-link text-muted" target="_blank">About Us</a>
              </li>
              <li className="nav-item">
                <a href="#" className="nav-link text-muted" target="_blank">Blog</a>
              </li>
              <li className="nav-item">
                <a href="#" className="nav-link pe-0 text-muted" target="_blank">License</a>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer;