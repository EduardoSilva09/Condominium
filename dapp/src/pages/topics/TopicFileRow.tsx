import { keccak256, toUtf8Bytes } from "ethers";
import { isManager, Status } from "../../services/Web3Service";

type Props = {
  filename: string;
  topicTitle: string;
  onDelete: Function;
  status?: Status
}

function TopicFileRow(props: Props) {

  function btnDeleteClick() {
    if (window.confirm("Are you sure to delete this file?"))
      props.onDelete(props.filename);
  }

  function getTopicFileURL() {
    const hash = keccak256(toUtf8Bytes(props.topicTitle));
    return `${process.env.REACT_APP_API_URL}/topicfiles/${hash}/${props.filename}?token=${localStorage.getItem("token")}`;
  }

  return (
    <tr>
      <td>
        <a href={getTopicFileURL()} target="_blank" className="ms-3">{props.filename}</a>
      </td>
      <td>
        <a href={getTopicFileURL()} target="_blank" className="btn btn-success btn-sm me-1 mb-0">
          <i className="material-icons text-sm">cloud_download</i>
        </a>
        {
          isManager() && props.status === Status.IDLE
            ? (
              <a href="#" className="btn btn-danger btn-sm me-1 mb-0" onClick={btnDeleteClick}>
                <i className="material-icons text-sm">delete</i>
              </a>
            )
            : <></>
        }

      </td>
    </tr>
  )
}

export default TopicFileRow;