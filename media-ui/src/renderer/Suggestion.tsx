import { useEffect, useState } from "react"
import { MetaResponse, QueryResult, preview } from "./MediaClient"

import './Suggestion.css'

const imgScaler = 600

interface SuggestionProps {
    doc: QueryResult
    setDoc: (d: QueryResult) => void
}

const Suggestion = ({ doc, setDoc }: SuggestionProps) => {
    const [info, setInfo] = useState<MetaResponse | undefined>(undefined)

    useEffect(() => {
        preview(doc.imdb).then(setInfo)
    }, [doc.imdb])

    return(
        <div className="suggestion" onClick={() => setDoc(doc)}>
            {info?.image && <img src={info.image} alt="Not found"></img>}
        </div>
    )
}

export default Suggestion