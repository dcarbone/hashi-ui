import React, { Component } from "react"
import PropTypes from "prop-types"
import { connect } from "react-redux"
import { orange500 } from "material-ui/styles/colors"
import FontIcon from "material-ui/FontIcon"
import AllocationTopbar from "../components/AllocationTopbar/AllocationTopbar"
import JobLink from "../components/JobLink/JobLink"
import AllocationLink from "../components/AllocationLink/AllocationLink"
import ClientLink from "../components/ClientLink/ClientLink"
import { Link, withRouter } from "react-router"
import { NOMAD_WATCH_ALLOC, NOMAD_UNWATCH_ALLOC, NOMAD_WATCH_ALLOCS, NOMAD_UNWATCH_ALLOCS } from "../sagas/event"
import { default as shortenUUID } from "../helpers/uuid"

class Allocation extends Component {
  componentWillMount() {
    this.props.dispatch({
      type: NOMAD_WATCH_ALLOC,
      payload: this.props.params.allocId
    })
  }

  componentWillUnmount() {
    this.props.dispatch({
      type: NOMAD_UNWATCH_ALLOC,
      payload: this.props.params.allocId
    })

    this.props.dispatch({
      type: NOMAD_UNWATCH_ALLOCS
    })
  }

  componentDidUpdate(prevProps) {
    if (this.props.allocation.DesiredStatus && this.props.allocation.DesiredStatus != "run") {
      if (this.props.allocations.length === 0) {
        this.props.dispatch({ type: NOMAD_WATCH_ALLOCS })
      } else {
        this.props.dispatch({ type: NOMAD_UNWATCH_ALLOCS })
      }
    }

    if (prevProps.params.allocId == this.props.params.allocId) {
      return
    }

    if (prevProps.params.allocId) {
      this.props.dispatch({
        type: NOMAD_UNWATCH_ALLOC,
        payload: prevProps.params.allocId
      })
    }

    this.props.dispatch({
      type: NOMAD_WATCH_ALLOC,
      payload: this.props.params.allocId
    })
  }

  getName() {
    const name = this.props.allocation.Name

    return name.substring(name.indexOf("[") + 1, name.indexOf("]"))
  }

  derp() {
    if (this.props.allocation.DesiredStatus == "run") {
      return
    }

    if (this.props.allocations.length == 0) {
      return
    }

    let alt = this.props.allocations.filter(
      a => a.Name == this.props.allocation.Name && a.ID != this.props.allocation.ID && a.DesiredStatus == "run"
    )

    if (alt.length == 0) {
      return
    }

    alt = alt[0]
    return (
      <div className="warning-bar" style={{ backgroundColor: orange500 }}>
        <FontIcon className="material-icons" color="white">
          info
        </FontIcon>
        <div>
          <AllocationLink allocationId={alt.ID}>View replacement allocation</AllocationLink>
        </div>
      </div>
    )
  }

  breadcrumb() {
    const query = this.props.location.query || {}
    const location = this.props.location
    const end = location.pathname.split("/").pop()
    let out = []

    out.push(
      <span key="jobs">
        <Link to={{ pathname: `/nomad/${this.props.router.params.region}/jobs` }}>Jobs</Link>
      </span>
    )
    out.push(" > ")

    out.push(
      <span key="job">
        <Link to={{ pathname: `/nomad/${this.props.router.params.region}/jobs/${this.props.allocation.JobID}/info` }}>
          {this.props.allocation.JobID}
        </Link>
      </span>
    )
    out.push(" > ")

    out.push(
      <span key="allocations">
        <Link
          to={{ pathname: `/nomad/${this.props.router.params.region}/jobs/${this.props.allocation.JobID}/allocations` }}
        >
          Allocations
        </Link>
      </span>
    )
    out.push(" > ")

    out.push(
      <span key="allocation">
        <Link
          to={{ pathname: `/nomad/${this.props.router.params.region}/allocations/${this.props.allocation.ID}/info` }}
        >
          {this.props.allocation.TaskGroup}[{this.getName()}] ({shortenUUID(this.props.allocation.ID)})
        </Link>
      </span>
    )
    out.push(" > ")

    if (end.startsWith("info")) {
      out.push(
        <Link
          key="info"
          to={{ pathname: `/nomad/${this.props.router.params.region}/allocations/${this.props.allocation.ID}/info` }}
        >
          Info
        </Link>
      )
    }

    if ("path" in query && query["path"].startsWith("/alloc/logs")) {
      out.push(
        <Link
          key="logs"
          to={{
            pathname: `/nomad/${this.props.router.params.region}/allocations/${this.props.allocation.ID}/files`,
            query: {
              path: query.path
            }
          }}
        >
          Logs
        </Link>
      )
    } else if (end.startsWith("files")) {
      out.push(
        <Link
          key="files"
          to={{
            pathname: `/nomad/${this.props.router.params.region}/allocations/${this.props.allocation.ID}/files`
          }}
        >
          Files
        </Link>
      )
    }

    if (end.startsWith("raw")) {
      out.push(
        <Link
          key="raw"
          to={{ pathname: `/nomad/${this.props.router.params.region}/allocations/${this.props.allocation.ID}/raw` }}
        >
          Raw
        </Link>
      )
    }

    out.push(" @ ")
    out.push(<ClientLink key="client" clientId={this.props.allocation.NodeID} clients={this.props.nodes} />)

    return out
  }

  render() {
    if (this.props.allocation.ID == null) {
      return <div>Loading allocation ...</div>
    }

    return (
      <div>
        <div style={{ padding: 10, paddingBottom: 0 }}>
          <h3 style={{ marginTop: "10px", marginBottom: "15px" }}>
            {this.breadcrumb()}
          </h3>

          {this.derp()}

          <AllocationTopbar {...this.props} />

          {this.props.children}
        </div>
      </div>
    )
  }
}

function mapStateToProps({ allocation, allocations, nodes }) {
  return { allocation, allocations, nodes }
}

Allocation.propTypes = {
  dispatch: PropTypes.func.isRequired,
  params: PropTypes.object.isRequired,
  allocation: PropTypes.object.isRequired,
  allocations: PropTypes.array.isRequired,
  nodes: PropTypes.array.isRequired,
  location: PropTypes.object.isRequired, // eslint-disable-line no-unused-vars
  children: PropTypes.object.isRequired
}

export default connect(mapStateToProps)(withRouter(Allocation))
