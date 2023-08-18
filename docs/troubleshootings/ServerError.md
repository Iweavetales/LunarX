# Server Error solutions

## Error: useNavigate() may be used only in the context of a <Router> component.
1. Remove package-lock.json or pnpm-lock.yaml
2. Match same versions between `react`=`react-dom`, `react-router`=`react-router-dom`
   1. ![same-react-version-pair.png](same-react-version-pair.png)
3. `$ pnpm i` 
4. `$ lunar build`