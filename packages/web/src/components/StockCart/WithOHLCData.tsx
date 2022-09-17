import { tsvParse } from "d3-dsv";
import { timeParse } from "d3-time-format";
import * as React from "react";
import { useQuery } from "react-query";
import { IOHLCData } from "./types";

const parseDate = timeParse("%Y-%m-%d");

const parseData = () => {
    return (d: any) => {
        const date = parseDate(d.date);
        if (date === null) {
            d.date = new Date(Number(d.date));
        } else {
            d.date = new Date(date);
        }

        for (const key in d) {
            if (key !== "date" && Object.prototype.hasOwnProperty.call(d, key)) {
                d[key] = +d[key];
            }
        }

        return d as IOHLCData;
    };
};

interface WithOHLCDataProps {
    readonly data: IOHLCData[];
}

interface WithOHLCState {
    data?: IOHLCData[];
    message: string;
}

export function withOHLCData(dataSet = "DAILY") {
    return <TProps extends WithOHLCDataProps>(OriginalComponent: React.ComponentClass<TProps>) => {

        return function (props: Omit<TProps, "data">) {

            const [data, setData] = React.useState<IOHLCData[]>([]);
            const [message, setMessage] = React.useState<string>(`Loading ${dataSet} data...`);

            const query = useQuery('data', () => {
                return fetch('/luno/api/exchange/1/candles')
                    .then(response => response.json())
            });

            if(query.isSuccess){
                const _data = query.data.candles.map(c => {
                    c['date'] = new Date(c[])
                    return c;
                })
                console.log(_data)
            }

            React.useEffect(() => {
                fetch(
                    `https://raw.githubusercontent.com/reactivemarkets/react-financial-charts/master/packages/stories/src/data/${dataSet}.tsv`,
                )
                    .then((response) => response.text())
                    .then((data) => tsvParse(data, parseData()))
                    .then((data) => {
                        setData(data);
                    })
                    .catch(() => {
                        setMessage(`Failed to fetch data.`);
                    });
            },[])
            
            return (
                <OriginalComponent {...(props as TProps)} data={data} />
            );
        }
    };
}