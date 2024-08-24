import { ethers } from "ethers"
import { Link, useLocation } from "react-router-dom";

type Props = {
  count: ethers.BigNumberish,
  pageSize: number
}

function Pagination(props: Props) {
  function useQuery() {
    return new URLSearchParams(useLocation().search);
  }
  const query = useQuery();

  function getPageLink(page: number) {
    return `${window.location.pathname}?page=${page}`
  }

  function getPageClass(page: number) {
    const queryPage = parseInt(query.get("page") || "1");
    const isActive = queryPage === page || (!queryPage && page === 1);
    return isActive ? "page-item active" : "page-item"
  }

  function getBottom() {
    const count = ethers.toNumber(props.count);
    console.log(count);

    if (count > 0) {
      return (<div className="fw-normal small mt-4 mt-lg-0"><b>{count}</b> result(s).</div>)
    }
    return (<div className="fw-normal small mt-4 mt-lg-0"><b>No results found!</b> Create one first.</div>)
  }

  const pagesQty = Math.ceil(ethers.toNumber(props.count) / props.pageSize);

  const pages = [];
  for (let i = 1; i <= pagesQty; i++)
    pages.push(i);

  return (
    <div className="card-footer px-3 border-0 d-flex flex-column flex-lg-row align-items-center justify-content-between">
      <nav aria-label="Pagination Area">
        <ul className="pagination mb-0">
          {
            pages && pages.length
              ? pages.map(page => (
                <li key={page} className={getPageClass(page)}>
                  <Link className="page-link" to={getPageLink(page)}>{page}</Link>
                </li>)
              ) : <></>
          }
        </ul>
      </nav>
      {getBottom()}
    </div>
  )
}

export default Pagination