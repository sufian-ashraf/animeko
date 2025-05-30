// src/pages/CompanyPage.js
import {Link, useParams} from 'react-router-dom';
import {useEffect, useState} from 'react';
import '../styles/CompanyPage.css';

export default function CompanyPage() {
    const {companyId} = useParams();
    const [company, setCompany] = useState(null);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetch(`/api/company/${companyId}`)
            .then(res => {
                if (!res.ok) throw new Error(`Status ${res.status}`);
                return res.json();
            })
            .then(setCompany)
            .catch(err => {
                console.error('Fetch company error:', err);
                setError('Failed to load company');
            });
    }, [companyId]);

    if (error) return <div style={{color: 'red'}}>{error}</div>;
    if (!company) return <div>Loading company…</div>;

    const {name, country, founded, animeList = []} = company;

    return (<div>
            <h2>Company: {name}</h2>
            <p>
                {country && <>Country: {country}<br/></>}
                {founded && <>Founded: {new Date(founded).toLocaleDateString()}<br/></>}
            </p>

            <h3>Anime produced by this company</h3>
            {animeList.length > 0 ? (<ul>
                    {animeList.map(a => (<li key={a.animeId}>
                            <Link to={`/anime/${a.animeId}`}>{a.title}</Link>
                        </li>))}
                </ul>) : (<p>No anime found for this company.</p>)}
        </div>);
}
