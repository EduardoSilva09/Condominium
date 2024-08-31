import { useState } from "react";
import { Status } from "../../services/Web3Service";
import Loader from "../../components/Loader";
import TopicFileRow from "./TopicFileRow";

type Props = {
  title: string;
  status?: Status;
}

function TopicFiles(props: Props) {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [files, setFiles] = useState<string[]>([]);
  const [newFile, setNewFile] = useState<File>();

  function onDeleteTopicFile(filename: string) {
    alert(filename);
  }

  function onFileChange(evt: React.ChangeEvent<HTMLInputElement>) {
    if (evt.target.files) {
      setNewFile(evt.target.files[0])
    }
  }

  return (
    <div className="row">
      <div className="col-12">
        <div className="card my-4">
          <div className="card-header p-0 position-relative mt-n4 mx-3 z-index-2">
            <div className="bg-gradient-primary shadow-primary border-radius-lg pt-4 pb-3">
              <h6 className="text-white text-capitalize ps-3">
                <i className="material-icons opacity-10 me-2">cloud_upload</i>
                Files
              </h6>
            </div>
          </div>
          <div className="card-body px-0 pb-2">

            {
              isLoading
                ? <Loader />
                : <></>
            }
            <div className="table-responsive p-0">
              <table className="table align-items-center mb-0">
                <thead>
                  <tr>
                    <th className="text-uppercase text-secondary text-xxs font-weight-bolder opacity-7">File Name</th>
                    <th className="text-secondary opacity-7"></th>
                  </tr>
                </thead>
                <tbody>
                  {
                    files && files.length
                      ? files.map(file =>
                        <TopicFileRow
                          filename={file}
                          key={file}
                          topicTitle={props.title}
                          status={props.status}
                          onDelete={() => onDeleteTopicFile(file)}
                        />
                      )
                      : (
                        <tr>
                          <td colSpan={2}>
                            <p className="ms-3">
                              There are no files for this topic. Upload one first.
                            </p>
                          </td>
                        </tr>
                      )
                  }
                </tbody>
              </table>
              <hr />
              {
                props.status === Status.IDLE
                  ? (
                    <div className="row mb-3">
                      <div className="col-md-6 mb-3">
                        <div className="form-group">
                          <h6>Upload a new file:</h6>
                          <div className="input-group input-group-outline">
                            <input className="form-control" type="file" id="newFile" onChange={onFileChange}></input>
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                  : <></>
              }
            </div>

          </div>
        </div>
      </div>
    </div>
  )
}

export default TopicFiles;