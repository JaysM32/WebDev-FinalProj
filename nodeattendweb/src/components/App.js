import React from "react"
import Register from "./FirebaseRegister"
import { AuthProvider } from "../backends/AuthCont"
import { BrowserRouter, Switch, Route } from "react-router-dom"
import Dashboard from "./Dashboard"
import Login from "./Login"
import PrivRoute from "./PrivateRoute"
import ForgotPassword from "./ForgotPassword"
import UpdateProfile from "./UpdateProfile"
import Account from './Account'
import StudClass from './StudClass'
import StudEdit from'./StudEdit'
import NodefluxRegister from "./NodefluxRegister"


function App() {
  return (
      <div>
        <BrowserRouter>
          <AuthProvider>
            <Switch>
              <PrivRoute exact path="/" component={Dashboard} />
              <PrivRoute exact path="/update-profile" component={UpdateProfile} />
              <PrivRoute exact path="/Account" component={Account} />
              <PrivRoute exact path="/StudClass" component={StudClass} />
              <PrivRoute path="/studEdit/:id" component={StudEdit} />
              <PrivRoute exact path='/Account/nodeRegister' component={NodefluxRegister}/>
              <Route exact path="/signup" component={Register} />
              <Route exact path="/login" component={Login} />
              <Route exact path="/forgot-password" component={ForgotPassword} />
            </Switch>
          </AuthProvider>
        </BrowserRouter>
      </div>
  )
}

export default App
