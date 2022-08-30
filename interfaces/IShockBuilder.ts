export interface IShockGraph{
   data: [
          {
            x: number[],
            y: number[],
            type: string,
            name: string,
            mode: string,
            marker: {
              size: number
            },
            line: {
              width: number
            }
          }
        ],
    layout: 
        {
            autosize: boolean,
            showlegend: boolean, 
            legend: {x: number, y: number, "orientation": string}, 
        title: string,
        xaxis: {
            title: string, 
            automargin: boolean,
            zeroline: boolean,
            showline: boolean, 
            range: number[],
            dtick: number
        },
        yaxis: {
            title: string,
            zeroline: boolean,
            showline: boolean
        },
        margin: {
        l: number,
        r: number,
        b: number,
        t: number,
        pad: number
        },
    },
}

export interface IShockItem{
    vel:number;
    force:number
}
