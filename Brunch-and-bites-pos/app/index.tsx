import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, Image, StyleSheet, Alert } from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from './contexts/AuthContext';



export default function Login() {
  const [usuario, setUsuario] = useState("");
  const [contrasena, setContrasena] = useState("");
  const router = useRouter();
  const { login } = useAuth();

  const handleLogin = async () => {
    if (usuario === "" || contrasena === "") {
      Alert.alert("Error", "Por favor ingresa usuario y contraseña");
      return;
    } 
    
    try {
      const success = await login(usuario, contrasena);
      if (success) {
        router.push("/caja");  // 🎯 Redirigir directamente a la caja
      } else {
        Alert.alert("Error", "Usuario o contraseña incorrectos");
      }
    } catch (error) {
      console.error('Error en login:', error);
      Alert.alert("Error", "Problema al iniciar sesión");
    }
  };

  return (
    <View style={styles.root}>
      <View style={styles.centered}>
        <Image
          source={require("../assets/images/logo.jpeg")}
          style={styles.logo}
        />
        <Text style={styles.headerTitle}>Iniciar sesión</Text>
        <View style={styles.formContainer}>
          <Text style={styles.label}>Usuario</Text>
          <TextInput
            style={styles.input}
            placeholder="Usuario"
            value={usuario}
            onChangeText={setUsuario}
            autoCapitalize="none"
          />
          <Text style={styles.label}>Contraseña</Text>
          <TextInput
            style={styles.input}
            placeholder="Contraseña"
            value={contrasena}
            onChangeText={setContrasena}
            secureTextEntry
          />
          <TouchableOpacity style={styles.loginBtn} onPress={handleLogin}>
            <Text style={styles.loginBtnText}>Entrar</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#e6f0fa",
    justifyContent: "center",
    alignItems: "center",
  },
  centered: {
    alignItems: "center",
    width: "100%",
  },
  logo: {
    width: 140,
    height: 140,
    borderRadius: 8,
    backgroundColor: "#fff",
    resizeMode: "contain",
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 24,
  },
  formContainer: {
    width: 320,
    backgroundColor: "#f9f9f9",
    borderRadius: 12,
    padding: 24,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  label: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 6,
    color: "#333",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 18,
    fontSize: 16,
    backgroundColor: "#fff",
  },
  loginBtn: {
    backgroundColor: "#38b24d",
    paddingVertical: 14,
    borderRadius: 6,
    alignItems: "center",
    marginTop: 10,
  },
  loginBtnText: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "bold",
  },
});