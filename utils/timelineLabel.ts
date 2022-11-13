import TimelineProps from "../interfaces/TimelineProps";

export default (timeline: TimelineProps) => {
    let tlLabel = 'Timeline'
    if (timeline.type === 'home') tlLabel = 'Home'
    if (timeline.type === 'local') tlLabel = 'Local'
    if (timeline.type === 'public') tlLabel = 'Public'
    if (timeline.type === 'user') tlLabel = 'User'
    if (timeline.type === 'bookmark') tlLabel = 'Bookmark'
    if (timeline.type === 'fav') tlLabel = 'Favs'
    if (timeline.type === 'notif') tlLabel = 'Notification'
    if (timeline.type === 'hashtag') tlLabel = `Tag #${decodeURIComponent(timeline.timelineData.target)}`
    if (timeline.type === 'list') tlLabel = `List ${timeline.timelineData.title}`
    return tlLabel
}